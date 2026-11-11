<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('avatar')->default('pink');
            $table->string('pin_hash');
            $table->unsignedInteger('weekly_allowance')->default(500); // cents
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kids');
    }
};
