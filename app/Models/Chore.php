<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $kid_id
 * @property string $title
 * @property int $reward cents
 * @property string $status todo | done | approved
 */
#[Fillable(['title', 'reward', 'status', 'done_at', 'approved_at'])]
class Chore extends Model
{
    protected function casts(): array
    {
        return [
            'done_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
