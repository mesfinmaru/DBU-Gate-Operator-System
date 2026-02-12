<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Asset;
use App\Models\ExitLog;
use App\Services\QrService;
class AdminController extends Controller {
    public function studentStatus(Request $req) {
        $op = $req->user();
        if (!$op || $op->role !== 'admin') return response()->json(['error'=>'Admin access required'],403);
        $sid = (string)$req->input('student_id');
        $status = (string)$req->input('status');
        if (!$sid || !$status) return response()->json(['error'=>'student_id and status required'],400);
        $allowed = ['active','blocked'];
        if (!in_array($status, $allowed, true)) return response()->json(['error'=>'Invalid status'],400);
        $student = Student::find($sid);
        if (!$student) return response()->json(['error'=>'Student not found'],404);
        $student->status = $status;
        $student->save();
        return response()->json(['message'=>'Student status updated','student'=>$student],200);
    }
    public function assetStatus(Request $req) {
        $op = $req->user();
        if (!$op || $op->role !== 'admin') return response()->json(['error'=>'Admin access required'],403);
        $aid = (int)$req->input('asset_id');
        $status = (string)$req->input('status');
        if (!$aid || !$status) return response()->json(['error'=>'asset_id and status required'],400);
        $allowed = ['active','revoked','stolen'];
        if (!in_array($status, $allowed, true)) return response()->json(['error'=>'Invalid status'],400);
        $asset = Asset::find($aid);
        if (!$asset) return response()->json(['error'=>'Asset not found'],404);
        $asset->status = $status;
        $asset->save();
        return response()->json(['message'=>'Asset status updated','asset'=>$asset],200);
    }
    public function registerAsset(Request $req) {
        $op = $req->user();
        if (!$op || $op->role !== 'admin') return response()->json(['error'=>'Admin access required'],403);
        $studentId = trim((string)$req->input('owner_student_id',''));
        $serial = trim((string)$req->input('serial_number',''));
        if (!$studentId || !$serial) return response()->json(['error'=>'owner_student_id and serial_number required'],400);
        $student = Student::find($studentId);
        if (!$student) return response()->json(['error'=>'Student not found'],404);
        if ($student->status !== 'active') return response()->json(['error'=>'Student not active'],400);
        $existing = Asset::where('serial_number',$serial)->first();
        if ($existing) return response()->json(['status'=>'CONFLICT','message'=>'Asset with this serial number already exists','existing_asset'=>$existing],409);
        $asset = Asset::create([
            'owner_student_id'=>$studentId,
            'serial_number'=>$serial,
            'brand'=>$req->input('brand'),
            'color'=>$req->input('color'),
            'visible_specs'=>$req->input('visible_specs'),
            'status'=>'active',
            'registered_at'=>now()
        ]);
        $qr = QrService::generate($asset);
        $asset->qr_signature = $qr;
        $asset->save();
        return response()->json(['message'=>'Asset registered successfully','asset'=>$asset,'qr_data'=>$qr,'student'=>$student],201);
    }
    public function assets() { return response()->json(['assets'=>Asset::all()]); }
    public function students() { return response()->json(['students'=>Student::all()]); }
    public function statistics() {
        $allowed = ExitLog::where('result','ALLOWED')->count();
        $blocked = ExitLog::where('result','BLOCKED')->count();
        return response()->json([
            'statistics'=>[
                'total_students'=>Student::count(),
                'active_students'=>Student::where('status','active')->count(),
                'total_assets'=>Asset::count(),
                'active_assets'=>Asset::where('status','active')->count(),
                'total_exits'=>ExitLog::count(),
                'allowed_exits'=>$allowed,
                'blocked_exits'=>$blocked
            ]
        ]);
    }
}
