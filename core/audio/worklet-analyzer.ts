/**
 * WorkletAnalyzer
 *
 * AudioWorkletNode 생성·연결·정리를 담당하는 래퍼.
 *
 * ⚠️  numberOfOutputs를 1로 유지하고 무음 GainNode를 거쳐 destination에
 *     연결해야 합니다. Web Audio API는 destination으로 이어지지 않는 노드를
 *     렌더링 그래프에서 제외할 수 있기 때문입니다.
 *
 *     source → gainNode → WorkletNode → silentGain(0) → destination
 *                                  └─ port.postMessage → onFrequency()
 */

export class WorkletAnalyzer {
  private _node:       AudioWorkletNode | null = null;
  private _silentGain: GainNode         | null = null;

  get node(): AudioWorkletNode | null {
    return this._node;
  }

  async init(
    ctx: AudioContext,
    onFrequency: (freq: number) => void
  ): Promise<void> {
    if (this._node) return;

    // Next.js static export: public/worklets/ → /worklets/
    await ctx.audioWorklet.addModule("/worklets/pitch-processor.js");

    this._node = new AudioWorkletNode(ctx, "pitch-processor", {
      numberOfInputs:     1,
      numberOfOutputs:    1,   // 0이면 렌더링 그래프에서 제외될 수 있음
      outputChannelCount: [1],
    });

    // 무음 출력 → destination 연결: 그래프 활성화 유지, 실제 소리는 안 남
    this._silentGain = ctx.createGain();
    this._silentGain.gain.value = 0;
    this._node.connect(this._silentGain);
    this._silentGain.connect(ctx.destination);

    this._node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      onFrequency(e.data[0]);
    };
  }

  setChannel(channelIdx: number): void {
    this._node?.port.postMessage({ type: "setChannel", channel: channelIdx });
  }

  dispose(): void {
    if (this._node) {
      this._node.port.onmessage = null;
      this._node.disconnect();
      this._node = null;
    }
    if (this._silentGain) {
      this._silentGain.disconnect();
      this._silentGain = null;
    }
  }
}
