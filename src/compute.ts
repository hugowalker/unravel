export const computeMarkup = `<article class="panel compute-panel"><div class="panel-title"><span>Raspberry Pi resource estimates</span><span class="mini">Modelled values · no board connected</span></div><div class="compute-body"><div class="compute-settings"><p>Raspberry Pi 4B · 4 GB</p><label>Assumed loaded power<select id="compute-budget"><option value="5">5 W</option><option value="10" selected>10 W</option></select></label><label>Requested frame rate <output id="compute-fps-out">10 fps</output><input id="compute-fps" type="range" min="1" max="30" value="10"></label><label>Assumed inference time<input id="compute-ms" type="number" min="1" max="5000" step="1" value="30"> ms/frame</label><label>Reserved OS / application memory<input id="compute-reserve" type="number" min="0" max="8192" step="64" value="768"> MiB</label></div><div class="compute-readout"><div class="compute-stage" id="compute-stage">Idle · start tracking to apply the workload</div><div class="compute-metrics"><div><span>Estimated RAM</span><strong id="compute-ram">—</strong><meter id="compute-ram-meter" min="0" max="4096" value="0" aria-label="Estimated computer memory use"></meter></div><div><span>Estimated Pi power</span><strong id="compute-power">—</strong><meter id="compute-power-meter" min="0" max="10" value="0" aria-label="Estimated Pi power"></meter></div><div><span>Modelled throughput</span><strong id="compute-rate">—</strong><small id="compute-load">No workload</small></div></div><p id="compute-warning">No Raspberry Pi telemetry connection. Values are estimates.</p><details><summary>Estimation method</summary><p>RAM = user-reserved memory + seven classifier weight arrays stored as float32 + three 320 × 180 RGB buffers. Power = an assumed 2 W idle baseline interpolated to the chosen budget using workload utilisation. Throughput is limited by the assumed inference time. These are teaching assumptions, not device benchmarks. Camera, cooling and motor power are excluded.</p><p>The power figures are user-selected assumptions, not hardware power modes or measurements. Actual power needs an external current/voltage sensor; Linux memory statistics need a connected telemetry service.</p></details></div></div></article>`;

export function estimateCompute(
  fps: number,
  inferenceMs: number,
  reserveMiB: number,
  weightCount: number,
  budgetW: number,
  active: boolean,
) {
  const utilisation = active ? Math.min(1, (fps * inferenceMs) / 1000) : 0;
  const memoryMiB =
    reserveMiB + (weightCount * 4 + 320 * 180 * 3 * 3) / 1048576;
  return {
    memoryMiB,
    powerW: 2 + (budgetW - 2) * utilisation,
    utilisation,
    throughput: active ? Math.min(fps, 1000 / inferenceMs) : 0,
    overloaded: active && fps * inferenceMs > 1000,
  };
}
