<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $kid_id
 * @property int|null $goal_id
 * @property string $item
 * @property int $amount cents
 * @property string $kid_reason
 * @property string|null $ai_summary
 * @property string $status pending | approved | paid | rejected
 * @property string|null $paypal_order_id
 */
#[Fillable(['goal_id', 'item', 'amount', 'kid_reason', 'ai_summary', 'status', 'paypal_order_id', 'decided_at', 'created_at'])]
class PurchaseRequest extends Model
{
    protected function casts(): array
    {
        return ['decided_at' => 'datetime'];
    }

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }
}
