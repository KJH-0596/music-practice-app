"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionNeeded, setPermissionNeeded] = useState(false);

  const { audioDeviceId, setAudioDeviceId, inputGain, setInputGain } = useSettingsStore();

  // 오디오 입력 장치 목록 갱신
  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const inputs = all.filter((d) => d.kind === "audioinput");

    // 레이블이 비어있으면 아직 권한이 없는 상태
    const hasLabels = inputs.some((d) => d.label !== "");
    setPermissionNeeded(!hasLabels);
    setDevices(inputs);
  }, []);

  // 모달 열릴 때마다 장치 목록 갱신
  useEffect(() => {
    if (open) refreshDevices();
  }, [open, refreshDevices]);

  // 장치 변경 감지 (USB 오인페 연결/해제 등)
  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  // 권한 요청 후 재열거
  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await refreshDevices();
    } catch {
      // 권한 거부
    }
  };

  const selectedDevice = devices.find((d) => d.deviceId === audioDeviceId);
  const displayLabel = selectedDevice?.label || "기본 장치";

  return (
    <>
      {/* 톱니바퀴 버튼 (fixed 우상단) */}
      <button
        onClick={() => setOpen(true)}
        title="설정"
        className="fixed top-4 right-4 z-60 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-700 hover:text-neutral-400 hover:bg-neutral-800 transition-all duration-150"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 패널 */}
          <div
            className="relative w-full max-w-sm mx-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">설정</span>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div className="px-5 py-5 flex flex-col gap-5">

              {/* 오디오 입력 장치 */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] tracking-widest text-neutral-600 uppercase font-medium">
                  오디오 입력 장치
                </label>

                {permissionNeeded ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-neutral-600">
                      장치 목록을 불러오려면 마이크 권한이 필요합니다.
                    </p>
                    <button
                      onClick={handleRequestPermission}
                      className="self-start px-3 h-7 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700 transition-colors"
                    >
                      권한 허용
                    </button>
                  </div>
                ) : devices.length === 0 ? (
                  <p className="text-xs text-neutral-700">감지된 장치가 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {/* 기본 장치 옵션 */}
                    <button
                      onClick={() => setAudioDeviceId(null)}
                      className={`flex items-center gap-2.5 px-3 h-9 rounded-lg text-xs text-left transition-all duration-150 ${
                        audioDeviceId === null
                          ? "bg-amber-400/15 text-amber-400 border border-amber-400/40"
                          : "bg-neutral-800 text-neutral-500 hover:text-neutral-300 border border-transparent"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          audioDeviceId === null ? "bg-amber-400" : "bg-neutral-700"
                        }`}
                      />
                      기본 장치
                    </button>

                    {/* 열거된 장치 목록 */}
                    {devices.map((device, i) => {
                      const isSelected = audioDeviceId === device.deviceId;
                      const label = device.label || `마이크 ${i + 1}`;
                      return (
                        <button
                          key={device.deviceId}
                          onClick={() => setAudioDeviceId(device.deviceId)}
                          className={`flex items-center gap-2.5 px-3 h-9 rounded-lg text-xs text-left transition-all duration-150 ${
                            isSelected
                              ? "bg-amber-400/15 text-amber-400 border border-amber-400/40"
                              : "bg-neutral-800 text-neutral-500 hover:text-neutral-300 border border-transparent"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isSelected ? "bg-amber-400" : "bg-neutral-700"
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 현재 선택 표시 */}
                {!permissionNeeded && (
                  <p className="text-[10px] text-neutral-700">
                    현재: {displayLabel}
                  </p>
                )}
              </div>

              {/* 입력 게인 */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] tracking-widest text-neutral-600 uppercase font-medium">
                    입력 게인
                  </label>
                  <span className="text-xs font-mono text-neutral-500">
                    ×{inputGain}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={inputGain}
                  onChange={(e) => setInputGain(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-neutral-700">
                  <span>×1 (원본)</span>
                  <span>×12 (최대 증폭)</span>
                </div>
                <p className="text-[10px] text-neutral-700 leading-relaxed">
                  소리가 작게 감지될 때 높여주세요. 오인페 사용 시 ×4 권장.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
