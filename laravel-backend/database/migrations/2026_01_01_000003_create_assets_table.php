<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('assets', function (Blueprint $table) {
            $table->id('asset_id');
            $table->string('owner_student_id', 20);
            $table->string('qr_signature', 500)->nullable()->unique();
            $table->string('serial_number', 100)->unique();
            $table->string('brand', 50)->nullable();
            $table->string('color', 30)->nullable();
            $table->text('visible_specs')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamps();
            $table->foreign('owner_student_id')->references('student_id')->on('students')->cascadeOnUpdate()->restrictOnDelete();
        });
        Schema::table('assets', function (Blueprint $table) {
            $table->index('owner_student_id');
            $table->index('status');
        });
    }
    public function down(): void { Schema::dropIfExists('assets'); }
};
