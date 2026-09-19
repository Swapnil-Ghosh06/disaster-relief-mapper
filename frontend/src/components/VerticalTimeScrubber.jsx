import React from 'react';
import * as Slider from '@radix-ui/react-slider';

/**
 * VerticalTimeScrubber — Vertical timeline/water-level scrubber on the right edge of the viewport
 * Faithfully replicates the vertical time slider in the Wellington Smart City UI (Screenshot 5)
 */
export function VerticalTimeScrubber({
  value = 8,
  max = 15,
  min = 0,
  step = 0.5,
  onChange,
  unit = 'm',
  label = 'SURGE',
}) {
  return (
    <aside className="vertical-scrubber-container" aria-label="Vertical Simulation Scrubber">
      <div className="scrubber-header-icon" title="Simulation Time & Surge Scrubber">
        ⏱️
      </div>

      <div className="scrubber-track-wrap">
        <Slider.Root
          className="vertical-slider-root"
          orientation="vertical"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([v]) => onChange?.(v)}
        >
          <Slider.Track className="vertical-slider-track">
            <Slider.Range className="vertical-slider-range" />
          </Slider.Track>
          <Slider.Thumb className="vertical-slider-thumb" aria-label="Simulation Level">
            <div className="slider-thumb-bubble">
              {value.toFixed(1)}{unit}
            </div>
          </Slider.Thumb>
        </Slider.Root>
      </div>

      <div className="scrubber-footer-readout">
        {value.toFixed(0)}:00
      </div>
    </aside>
  );
}

export default VerticalTimeScrubber;
