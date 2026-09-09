<?php
/**
 * Renders a dependency-free CSS bar chart (no JS library, no CDN).
 * $data = [['label' => 'MM-DD', 'value' => 123.45], ...]
 */
function render_bar_chart(array $data, string $valuePrefix = '₱'): void
{
    $max = 0;
    foreach ($data as $d) {
        $max = max($max, $d['value']);
    }
    $max = $max > 0 ? $max : 1;
    ?>
    <div style="display:flex; align-items:flex-end; gap:4px; height:220px; padding-top:1.5rem; border-bottom:1px solid #eceef2;">
      <?php foreach ($data as $d):
        $heightPct = max(2, round(($d['value'] / $max) * 100));
      ?>
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;" title="<?= e($d['label']) ?>: <?= e($valuePrefix . number_format($d['value'], 2)) ?>">
          <div style="width:100%; max-width:22px; background:#f9490c; border-radius:3px 3px 0 0; height:<?= $heightPct ?>%; min-height:2px;"></div>
        </div>
      <?php endforeach; ?>
    </div>
    <div style="display:flex; gap:4px; margin-top:0.35rem;">
      <?php foreach ($data as $i => $d): ?>
        <div style="flex:1; text-align:center; font-size:10px; color:#8591a9;"><?= ($i % max(1, intdiv(count($data), 10) + 1) === 0) ? e(substr($d['label'], 5)) : '' ?></div>
      <?php endforeach; ?>
    </div>
    <?php
}
