<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('role'); // user | assistant
            $table->text('content');
            $table->json('choices')->nullable(); // quick-reply buttons shown under an assistant message
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
