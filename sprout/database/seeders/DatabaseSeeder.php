<?php

namespace Database\Seeders;

use App\Models\Kid;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Demo story: Rafi wants a $30 Lego set and has been saving his $5 allowance
 * for five weeks. During the demo a chore approval and one more allowance
 * take him over $30, he asks Sprout, and Dina pays through PayPal.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $dina = User::factory()->create([
            'name' => 'Dina',
            'email' => 'dina@sprout.test',
        ]);

        // Rafi: 5 × $5 allowance + $2 chore − $4 stickers = $23.00
        $rafi = $this->kid($dina, 'Rafi', 'sun', 500);
        $rafi->goals()->create([
            'title' => 'Lego set',
            'target_amount' => 3000,
        ]);

        foreach (range(5, 1) as $weeksAgo) {
            $rafi->transactions()->create([
                'type' => 'allowance',
                'amount' => 500,
                'note' => 'Weekly allowance',
                'created_at' => $this->saturday($weeksAgo),
            ]);
        }

        $rafi->chores()->create([
            'title' => 'Tidy your room',
            'reward' => 200,
            'status' => 'approved',
            'done_at' => now()->subWeeks(3),
            'approved_at' => now()->subWeeks(3),
        ]);
        $rafi->transactions()->create([
            'type' => 'chore',
            'amount' => 200,
            'note' => 'Tidy your room',
            'created_at' => now()->subWeeks(3),
        ]);

        $rafi->purchaseRequests()->create([
            'item' => 'Sticker pack',
            'amount' => 400,
            'kid_reason' => 'For my school notebook.',
            'ai_summary' => 'Small want. Rafi checked it still left him on track for the Lego set.',
            'status' => 'paid',
            'paypal_order_id' => 'SEED-ORDER-1',
            'decided_at' => now()->subWeeks(2),
            'created_at' => now()->subWeeks(2),
        ]);
        $rafi->transactions()->create([
            'type' => 'purchase',
            'amount' => -400,
            'note' => 'Sticker pack',
            'created_at' => now()->subWeeks(2),
        ]);

        $rafi->chores()->create([
            'title' => 'Feed the cat',
            'reward' => 200,
            'status' => 'done',
            'done_at' => now()->subMinutes(20),
        ]);
        $rafi->chores()->create(['title' => 'Water the plants', 'reward' => 100]);

        // Maya: second kid so the parent dashboard looks like a real family.
        $maya = $this->kid($dina, 'Maya', 'sky', 700);
        $maya->goals()->create(['title' => 'Headphones', 'target_amount' => 4000]);
        foreach (range(2, 1) as $weeksAgo) {
            $maya->transactions()->create([
                'type' => 'allowance',
                'amount' => 700,
                'note' => 'Weekly allowance',
                'created_at' => $this->saturday($weeksAgo),
            ]);
        }
        $maya->chores()->create(['title' => 'Wash the car', 'reward' => 300]);
        $maya->chores()->create(['title' => 'Take out the trash', 'reward' => 100]);
    }

    private function kid(User $parent, string $name, string $avatar, int $allowance): Kid
    {
        $kid = new Kid(['name' => $name, 'avatar' => $avatar, 'weekly_allowance' => $allowance]);
        $kid->setPin('1234');
        $parent->kids()->save($kid);

        return $kid;
    }

    private function saturday(int $weeksAgo)
    {
        return now()->subWeeks($weeksAgo)->startOfWeek()->addDays(5)->setTime(8, 0);
    }
}
