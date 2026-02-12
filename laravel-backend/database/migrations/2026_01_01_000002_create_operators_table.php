<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('operators', function (Blueprint $table) {
            $table->id();
            $table->string('username', 50)->unique();
            $table->string('password_hash', 200);
            $table->string('role', 20)->default('gate_operator');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('operators'); }
};
