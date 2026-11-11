<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Hash;

/**
 * @property int $id
 * @property int $parent_id
 * @property string $name
 * @property string $avatar
 * @property string $pin_hash
 * @property int $weekly_allowance cents
 */
#[Fillable(['name', 'avatar', 'pin_hash', 'weekly_allowance'])]
#[Hidden(['pin_hash'])]
class Kid extends Model
{
    public const AVATARS = ['pink', 'sun', 'sky', 'orange', 'leaf'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function chores(): HasMany
    {
        return $this->hasMany(Chore::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    /** The goal the kid is saving for right now: the oldest one not bought yet. */
    public function activeGoal(): HasOne
    {
        return $this->hasOne(Goal::class)->whereNull('completed_at')->oldestOfMany();
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function setPin(string $pin): void
    {
        $this->pin_hash = Hash::make($pin);
    }

    public function checkPin(string $pin): bool
    {
        return Hash::check($pin, $this->pin_hash);
    }
}
