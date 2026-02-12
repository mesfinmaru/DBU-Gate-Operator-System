<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('students', function (Blueprint $table) {
            $table->string('student_id', 20)->primary();
            $table->string('full_name', 100);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
        Schema::table('students', function (Blueprint $table) {
            $table->index('status');
        });
    }
    public function down(): void { Schema::dropIfExists('students'); }
};
