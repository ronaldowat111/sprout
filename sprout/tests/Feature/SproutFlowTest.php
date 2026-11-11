<?php

namespace Tests\Feature;

use App\Models\Chore;
use App\Models\Kid;
use App\Models\PurchaseRequest;
use App\Models\User;
use App\Services\LedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The demo story end to end: chores, allowance, coach, request, PayPal. */
class SproutFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

    private Kid $kid;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.anthropic.key' => null]); // offline coach: no network in tests
        $this->parent = User::factory()->create(['name' => 'Dina']);
        $this->kid = new Kid(['name' => 'Rafi', 'avatar' => 'sun', 'weekly_allowance' => 500]);
        $this->kid->setPin('1234');
        $this->parent->kids()->save($this->kid);
        $this->kid->goals()->create(['title' => 'Lego set', 'target_amount' => 3000]);
        $this->kid->transactions()->create(['type' => 'allowance', 'amount' => 2300, 'note' => 'Saved so far']);
    }

    public function test_kid_signs_in_with_pin_on_a_paired_device(): void
    {
        $this->post('/kid/login', ['kid_id' => $this->kid->id, 'pin' => '1234'])
            ->assertSessionHasErrors('pin'); // device not paired with a family yet

        $this->withCookie('sprout_family', (string) $this->parent->id)
            ->post('/kid/login', ['kid_id' => $this->kid->id, 'pin' => '9999'])
            ->assertSessionHasErrors('pin');

        $this->withCookie('sprout_family', (string) $this->parent->id)
            ->post('/kid/login', ['kid_id' => $this->kid->id, 'pin' => '1234'])
            ->assertRedirect('/kid');

        $this->get('/kid')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('kid/home')
            ->where('kid.balance', 2300)
            ->where('kid.goal.title', 'Lego set'));
    }

    public function test_kid_pages_need_a_kid_session(): void
    {
        $this->get('/kid')->assertRedirect('/kid/login');
        $this->get('/kid/coach')->assertRedirect('/kid/login');
    }

    public function test_full_demo_story(): void
    {
        $ledger = app(LedgerService::class);
        $chore = $this->kid->chores()->create(['title' => 'Feed the cat', 'reward' => 200]);

        // Kid marks the chore done; parent approves it.
        $this->withSession(['kid_id' => $this->kid->id])->post("/kid/chores/{$chore->id}/done")->assertRedirect();
        $this->assertSame('done', $chore->fresh()->status);

        $this->actingAs($this->parent)->post("/parent/chores/{$chore->id}/approve")->assertRedirect();
        $this->assertSame(2500, $ledger->balance($this->kid));

        // Still short: neither the coach nor the kid can send a request yet.
        $this->withSession(['kid_id' => $this->kid->id])->post('/kid/requests')->assertRedirect();
        $this->assertSame(0, PurchaseRequest::count());

        // Allowance takes Rafi to $30.
        $this->actingAs($this->parent)->post("/parent/kids/{$this->kid->id}/allowance")->assertRedirect();
        $this->assertSame(3000, $ledger->balance($this->kid));

        // Rafi asks Sprout, which sends the request (the coach cannot pay).
        $this->withSession(['kid_id' => $this->kid->id])
            ->post('/kid/coach', ['message' => 'Yes, send it to mom please'])
            ->assertRedirect('/kid/coach');

        $request = PurchaseRequest::firstOrFail();
        $this->assertSame('pending', $request->status);
        $this->assertSame(3000, $request->amount);
        $this->assertNotEmpty($request->ai_summary);
        $this->assertSame(3000, $ledger->balance($this->kid), 'A request alone must not move money.');

        // Parent pays with PayPal (faked sandbox).
        config(['services.paypal.client_id' => 'test-id', 'services.paypal.secret' => 'test-secret']);
        Http::fake([
            '*/v1/oauth2/token' => Http::response(['access_token' => 'tok']),
            '*/v2/checkout/orders' => Http::response(['id' => 'ORDER-1', 'status' => 'CREATED'], 201),
            '*/v2/checkout/orders/ORDER-1/capture' => Http::response(['id' => 'ORDER-1', 'status' => 'COMPLETED'], 201),
        ]);

        $this->actingAs($this->parent)
            ->postJson("/paypal/requests/{$request->id}/order")
            ->assertOk()
            ->assertJson(['id' => 'ORDER-1']);

        $this->actingAs($this->parent)
            ->postJson("/paypal/requests/{$request->id}/capture", ['orderID' => 'ORDER-1'])
            ->assertOk()
            ->assertJson(['status' => 'paid']);

        $this->assertSame('paid', $request->fresh()->status);
        $this->assertSame(0, $ledger->balance($this->kid));
        $this->assertNotNull($this->kid->goals()->first()->completed_at);

        // Paying twice is refused.
        $this->actingAs($this->parent)
            ->postJson("/paypal/requests/{$request->id}/capture", ['orderID' => 'ORDER-1'])
            ->assertStatus(422);
        $this->assertSame(0, $ledger->balance($this->kid));
    }

    public function test_ledger_is_untouched_when_paypal_does_not_complete(): void
    {
        $this->kid->transactions()->create(['type' => 'allowance', 'amount' => 700]);
        $request = $this->kid->purchaseRequests()->create(['item' => 'Lego set', 'amount' => 3000, 'kid_reason' => 'Saved up']);

        config(['services.paypal.client_id' => 'test-id', 'services.paypal.secret' => 'test-secret']);
        Http::fake([
            '*/v1/oauth2/token' => Http::response(['access_token' => 'tok']),
            '*/v2/checkout/orders' => Http::response(['id' => 'ORDER-2'], 201),
            '*/v2/checkout/orders/ORDER-2/capture' => Http::response(['id' => 'ORDER-2', 'status' => 'PAYER_ACTION_REQUIRED'], 201),
        ]);

        $this->actingAs($this->parent)->postJson("/paypal/requests/{$request->id}/order")->assertOk();
        $this->actingAs($this->parent)
            ->postJson("/paypal/requests/{$request->id}/capture", ['orderID' => 'WRONG'])
            ->assertStatus(422);
        $this->actingAs($this->parent)
            ->postJson("/paypal/requests/{$request->id}/capture", ['orderID' => 'ORDER-2'])
            ->assertStatus(409);

        $this->assertSame(3000, app(LedgerService::class)->balance($this->kid));
        $this->assertNotSame('paid', $request->fresh()->status);
    }

    public function test_simulated_payment_is_not_available_outside_local(): void
    {
        $this->kid->transactions()->create(['type' => 'allowance', 'amount' => 700]);
        $request = $this->kid->purchaseRequests()->create(['item' => 'Lego set', 'amount' => 3000, 'kid_reason' => 'Saved up']);

        $this->actingAs($this->parent)->postJson("/paypal/requests/{$request->id}/simulate")->assertNotFound();
    }

    public function test_parents_only_see_their_own_family(): void
    {
        $other = User::factory()->create();
        $chore = $this->kid->chores()->create(['title' => 'Feed the cat', 'reward' => 200, 'status' => 'done']);

        $this->actingAs($other)->get("/parent/kids/{$this->kid->id}")->assertNotFound();
        $this->actingAs($other)->post("/parent/chores/{$chore->id}/approve")->assertNotFound();
        $this->actingAs($other)->post("/parent/kids/{$this->kid->id}/allowance")->assertNotFound();
        $this->assertSame(2300, app(LedgerService::class)->balance($this->kid));
    }

    public function test_parent_screens_render(): void
    {
        $this->kid->chores()->create(['title' => 'Feed the cat', 'reward' => 200, 'status' => 'done', 'done_at' => now()]);
        $this->actingAs($this->parent);

        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('parent/dashboard')
            ->where('totalSaved', 2300)
            ->has('needsYou', 1));
        $this->get('/parent/chores')->assertOk()->assertInertia(fn (Assert $page) => $page->component('parent/chores'));
        $this->get('/parent/approvals')->assertOk()->assertInertia(fn (Assert $page) => $page->component('parent/approvals'));
        $this->get('/parent/reports')->assertOk()->assertInertia(fn (Assert $page) => $page->component('parent/report'));
        $this->get("/parent/kids/{$this->kid->id}")->assertOk()->assertInertia(fn (Assert $page) => $page->component('parent/kid'));
        $this->get('/parent/kids/create')->assertOk();
    }

    public function test_kid_screens_render(): void
    {
        $this->withSession(['kid_id' => $this->kid->id]);

        $this->get('/kid/goal')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('kid/goal')
            ->where('kid.goal.weeksLeft', 2));
        $this->get('/kid/chores')->assertOk();
        $this->get('/kid/coach')->assertOk();
        $this->get('/kid/goal/reached')->assertRedirect('/kid/goal'); // not reached yet
    }

    public function test_offline_coach_gives_numbers_from_the_ledger(): void
    {
        $this->withSession(['kid_id' => $this->kid->id])
            ->post('/kid/coach', ['message' => 'Can I buy a game for $40?']);

        $reply = $this->kid->chatMessages()->where('role', 'assistant')->latest('id')->first();
        $this->assertStringContainsString('$17', $reply->content); // $40 − $23
        $this->assertNotEmpty($reply->choices);
    }
}
