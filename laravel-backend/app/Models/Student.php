<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Student extends Model {
    protected $primaryKey = 'student_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['student_id','full_name','status'];
    public function assets() { return $this->hasMany(Asset::class, 'owner_student_id', 'student_id'); }
    public function exits() { return $this->hasMany(ExitLog::class, 'student_id', 'student_id'); }
}
