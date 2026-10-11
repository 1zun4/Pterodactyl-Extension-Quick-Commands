<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Buttons without a server are an administrator's and show on every server of their eggs.
        Schema::create('ext_quick_commands_buttons', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('server_id')->nullable();
            $table->json('eggs')->nullable();
            $table->string('label', 48);
            $table->string('color', 16)->default('grey');
            $table->json('commands');
            $table->boolean('confirm')->default(false);
            $table->integer('sort')->default(0);
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ext_quick_commands_buttons');
    }
};
