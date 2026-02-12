<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GateController;
Route::post('/auth/login', [AuthController::class,'login']);
Route::post('/auth/register', [AuthController::class,'register'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('admin')->group(function () {
        Route::post('/register-asset', [AdminController::class,'registerAsset']);
        Route::get('/assets', [AdminController::class,'assets']);
        Route::get('/students', [AdminController::class,'students']);
        Route::get('/statistics', [AdminController::class,'statistics']);
        Route::post('/student-status', [AdminController::class,'studentStatus']);
        Route::post('/asset-status', [AdminController::class,'assetStatus']);
    });
    Route::prefix('gate/exit')->group(function () {
        Route::post('/scan-student', [GateController::class,'scanStudent']);
        Route::post('/scan-asset', [GateController::class,'scanAsset']);
        Route::post('/exit-without-asset', [GateController::class,'exitWithoutAsset']);
        Route::get('/logs', [GateController::class,'logs']);
    });
});
