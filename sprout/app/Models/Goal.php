<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $kid_id
 * @property string $title
 * @property int $target_amount cents
 * @property string|null $product_url
 */
#[Fillable(['title', 'target_amount', 'product_url', 'completed_at'])]
class Goal extends Model
{
    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
