<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $kid_id
 * @property string $type allowance | chore | purchase
 * @property int $amount cents, positive in, negative out
 * @property string|null $note
 */
#[Fillable(['type', 'amount', 'note', 'created_at'])]
class Transaction extends Model
{
    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
