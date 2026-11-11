<?php

use App\Http\Controllers\Kid\CoachController;
use App\Http\Controllers\Kid\KidAuthController;
use App\Http\Controllers\Kid\KidController;
use App\Http\Controllers\Parent\ApprovalController;
use App\Http\Controllers\Parent\ChoreController;
use App\Http\Controllers\Parent\DashboardController;
use App\Http\Controllers\Parent\KidController as ParentKidController;
use App\Http\Controllers\Parent\ReportController;
use App\Http\Controllers\PayPalController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Kid side: PIN sign-in under the parent's account, no user record.
Route::get('kid/login', [KidAuthController::class, 'show'])->name('kid.login');
Route::post('kid/login', [KidAuthController::class, 'store']);
Route::post('kid/logout', [KidAuthController::class, 'destroy'])->name('kid.logout');

Route::middleware('kid')->prefix('kid')->group(function () {
    Route::get('/', [KidController::class, 'home'])->name('kid.home');
    Route::get('goal', [KidController::class, 'goal'])->name('kid.goal');
    Route::post('goal', [KidController::class, 'storeGoal']);
    Route::get('goal/reached', [KidController::class, 'goalReached'])->name('kid.goal-reached');
    Route::post('requests', [KidController::class, 'storeRequest']);
    Route::get('chores', [KidController::class, 'chores'])->name('kid.chores');
    Route::post('chores/{chore}/done', [KidController::class, 'finishChore']);
    Route::get('coach', [CoachController::class, 'show'])->name('kid.coach');
    Route::post('coach', [CoachController::class, 'store'])->middleware('throttle:20,1');
    Route::delete('coach', [CoachController::class, 'reset']);
});

// Parent side.
Route::middleware(['auth', 'family'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('parent')->group(function () {
        Route::get('kids/create', [ParentKidController::class, 'create']);
        Route::post('kids', [ParentKidController::class, 'store']);
        Route::get('kids/{kid}', [ParentKidController::class, 'show']);
        Route::patch('kids/{kid}', [ParentKidController::class, 'update']);
        Route::post('kids/{kid}/allowance', [ParentKidController::class, 'giveAllowance']);

        Route::get('chores', [ChoreController::class, 'index'])->name('parent.chores');
        Route::post('chores', [ChoreController::class, 'store']);
        Route::post('chores/{chore}/approve', [ChoreController::class, 'approve']);
        Route::post('chores/{chore}/redo', [ChoreController::class, 'redo']);
        Route::delete('chores/{chore}', [ChoreController::class, 'destroy']);

        Route::get('approvals', [ApprovalController::class, 'index'])->name('parent.approvals');
        Route::post('requests/{purchaseRequest}/reject', [ApprovalController::class, 'reject']);

        Route::get('reports', ReportController::class)->name('parent.reports');
    });

    Route::post('paypal/requests/{purchaseRequest}/order', [PayPalController::class, 'createOrder']);
    Route::post('paypal/requests/{purchaseRequest}/capture', [PayPalController::class, 'capture']);
    Route::post('paypal/requests/{purchaseRequest}/simulate', [PayPalController::class, 'simulate']);
});

require __DIR__.'/settings.php';
