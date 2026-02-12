<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Asset extends Model {
    protected $primaryKey = 'asset_id';
    protected $fillable = ['owner_student_id','qr_signature','serial_number','brand','color','visible_specs','status','registered_at'];
    public function owner() { return $this->belongsTo(Student::class, 'owner_student_id', 'student_id'); }
    public function exits() { return $this->hasMany(ExitLog::class, 'asset_id'); }
}
