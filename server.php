<?php

/**
*
*/
class server
{
    public $worker_num=2;
    public $daemonize=false;
    public $baclog=128;
    public $ip='0.0.0.0';
    public $port=9502;
    private $serv=null;
    function __construct(){}

    public function  run(){
        try {
            $this->serv=new swoole_websocket_server($this->ip,$this->port);
        } catch (Exception $e) {
            echo $e->getError();
        }
        $this->serv->set([
            'worker_num'=>$this->worker_num,
            'daemonize'=>$this->daemonize,
            'baclog'=>$this->baclog,
            'log_file'=>'./error.log'
                ]);
        $this->serv->on('open',[$this,'onstart']);
        $this->serv->on('message',[$this,'onmessage']);
        $this->serv->on('close',[$this,'onclose']);
        $this->serv->start();
    }

    public function onstart($serv,$request){
        // var_export($serv);
      echo 'open_client:'.$request->fd."\n";
    }
    public function onmessage($serv,$frame){
        $data=json_decode($frame->data,true);
        switch ($data['type']) {
            case 1:
                $this->login($serv,$data['name'],$frame->fd);
                break;
            case 2:
                $this->sendMessage($serv,$frame->data,$frame->fd);
                break;
            default:
                break;
        }
    }
    public function onclose($serv,$fb){
        echo 'client close:'.$fb."\n";
        $redi=self::redis_init();
        $redi->del($fb);
        $this->serv->close($fb);
    }
    public function login($serv,$name,$fd){
        $redi=$this->redis_init();
        $n=array('name' =>htmlentities($name),'fd'=>$fd);
        if($redi->exists($fd)){
            $info='false';
        }else{
            $redi->set($fd,json_encode($n));
            $info='true';
        }
        $d=json_encode(['type'=>1,'info'=>$info,'name'=>htmlentities($name),'fd'=>$fd,'avatar'=>'./static/images/avatar/f1/f_'.rand(1,12).'.jpg']);
        foreach ($this->serv->connections as $value) {
            $this->serv->push($value,$d);
        }
    }
    public function sendMessage($serv,$data,$fds){
        $datas=[];
        $data=json_decode($data,true);
        $datas['type']=$data['type'];
        $datas['avatar']=$data['avatar'];
        $user=json_decode(self::redis_init()->get($fds),true);
        $datas['name']=$user['name'];
        $datas['newmessage']=htmlentities($data['message']);
        $datas['time']=date('Y-m-d H:i:s',time());
        if(count($this->serv->connections)>1){
            foreach ($this->serv->connections as $fd) {
            if($fd === $fds){
                $datas['mine']=true;
            }else{
                $datas['mine']=false;
            }
             $this->serv->push($fd,json_encode($datas));
            }
        }

    }
    public static function  redis_init(){
        $redis=new Redis();
        $redis->connect('127.0.0.1','6379');
        return $redis;
    }
}

$server=new server();
$server->run();
// print_r($option['worker_num']);