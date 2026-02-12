<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('exit_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->timestamp('timestamp')->useCurrent();
            $table->string('student_id', 20);
            $table->unsignedBigInteger('asset_id')->nullable();
            $table->unsignedBigInteger('operator_id');
            $table->string('result', 20);
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->foreign('student_id')->references('student_id')->on('students');
            $table->foreign('asset_id')->references('asset_id')->on('assets');
            $table->foreign('operator_id')->references('id')->on('operators');
        });
        Schema::table('exit_logs', function (Blueprint $table) {
            $table->index(['timestamp']);
            $table->index(['student_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('exit_logs'); }
};
