<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // allowance | chore | purchase
            $table->integer('amount'); // cents, + or −
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['kid_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
