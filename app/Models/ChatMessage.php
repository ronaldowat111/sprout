<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $kid_id
 * @property string $role user | assistant
 * @property string $content
 * @property array|null $choices quick-reply buttons shown under an assistant message
 */
#[Fillable(['role', 'content', 'choices'])]
class ChatMessage extends Model
{
    protected function casts(): array
    {
        return ['choices' => 'array'];
    }

    public function kid(): BelongsTo
    {
        return $this->belongsTo(Kid::class);
    }
}
