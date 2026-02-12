<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Operator;
class AuthController extends Controller {
    public function register(Request $req) {
        $username = (string)$req->input('username');
        $password = (string)$req->input('password');
        $role = (string)$req->input('role', 'gate_operator');
        if (!$username || !$password) return response()->json(['error'=>'Username and password required'], 400);
        if (Operator::where('username',$username)->exists()) return response()->json(['error'=>'Username already exists'],409);
        $allowSelf = (bool)config('eacs.allow_operator_self_registration', false);
        if (!$allowSelf) {
            $bootstrap = env('BOOTSTRAP_ADMIN_TOKEN');
            if (Operator::count() === 0 && $bootstrap) {
                if ($req->header('X-Bootstrap-Token') !== $bootstrap || $role !== 'admin') {
                    return response()->json(['error'=>'Bootstrap token required for initial admin'],403);
                }
            } else {
                $user = $req->user();
                if (!$user || $user->role !== 'admin') return response()->json(['error'=>'Admin access required'],403);
            }
        }
        $op = Operator::create([
            'username'=>$username,
            'password_hash'=>Hash::make($password),
            'role'=>$role
        ]);
        return response()->json(['message'=>'Operator registered successfully','user'=>$op],201);
    }
    public function login(Request $req) {
        $op = Operator::where('username',(string)$req->input('username'))->first();
        if (!$op || !Hash::check((string)$req->input('password'), $op->password_hash)) return response()->json(['error'=>'Invalid credentials'],401);
        $token = $op->createToken('gate-token', ['*'])->plainTextToken;
        return response()->json(['access_token'=>$token, 'user'=>['id'=>$op->id,'username'=>$op->username,'role'=>$op->role]],200);
    }
}
