$(document).ready(function(){
    server.init();
})
    var server={
    data:{chat:null,login:false,name:null,avatar:null},
    init:function(){
            this.ws();
        },
    doLogin:function(name){
            if(name==''){
                name=$('#name').val();
            }
            name=$.trim(name);
            if(name==''){
                alert('登陆名字不能空');
                return false;
            }
            var json=JSON.stringify({'type':1,'name':name});
            server.wsSend(json);
        },
    ws:function(){
            this.data.chat=new WebSocket('ws://127.0.0.1:9502');
            this.wsOpen();
            this.wsMessage();
            this.wsOnclose();
            this.wsOnerror();
        },
    wsOpen:function(){
            this.data.chat.onopen=function(evet){
                console.log('start');
            }
        },
    wsMessage:function(){
            this.data.chat.onmessage=function(evet){
                var data=$.parseJSON(evet.data);
                switch(data.type){
                    case 1:
                        server.logig_sourrce(data);
                        break;
                    case 2:
                        server.mess(data);
                        break;
                    default:
                        break;
                }
            }
        },
    wsOnclose:function(){
            this.data.chat.onclose=function(evet){
                console.log('关闭');
            }
        },
    wsOnerror:function(){
            this.data.chat.onerror=function(evet){
                alert('服务器开小差了');
            }
        },
    wsSend:function(data){
            this.data.chat.send(data);
        },
    logig_sourrce:function(info){
            // var d=$.parseJSON(info);
            if(info.info){
            server.loginDiv(info);
            this.data.login=true;
            this.data.name=info.name;
            this.data.avatar=info.avatar;
            var h=cdiv.render('newlogin',this.data.name);
            // $('#loginbox').css('display','none');
            // $('.nocontent-logo').css('display','block');
            // $('.input-area').css('display','block');
            // // $('.nput-area').css('display','block');
            // $('.action-area').css('display','block');
            }else{
                server.displayError('chatErrorMessage_logout','已经存在昵称',1);
            }

            console.dir(info.name);
        },
    wsSendMessage:function(data){
        if(!this.data.login) return false;
        //发送消息操作
        var text = $('#chattext').val();
        if(text.length == 0) return false;
        server.data.type = 2; //发送消息标志
        var json = {"type": 2,"name": server.data.name,"avatar": server.data.avatar,"message": text};
        server.wsSend(JSON.stringify(json));
        $('#chattext').val('');
        return true;
         // this.data.chat.send(data);//发送消息
        },
    displayError : function(divID,msg,f){
        var elem = $('<div>',{
            id      : divID,
            html    : msg
        });

        elem.click(function(){
            $(this).fadeOut(function(){
                $(this).remove();
            });
        });
        if(f){
            setTimeout(function(){
                elem.click();
            },5000);
        }
        elem.hide().appendTo('body').slideDown();
    },
    loginDiv : function(data){
        /*设置当前房间*/
        // this.data.crd = data.roomid;
        /*显示头像*/
        $('.profile').html(cdiv.render('my',data));
        $('#loginbox').fadeOut(function(){
            $('.input-area').fadeIn();
            $('.action-area').fadeIn();
            $('.input-area').focus();
        });
    },
    addChatLine : function(t,params){
        var markup = cdiv.render(t,params);
        $("#chatLineHolder").append(markup);
        this.scrollDiv('chat-lists');
    },
    scrollDiv:function(t){
        var mai=document.getElementById(t);
        mai.scrollTop = mai.scrollHeight+100;//通过设置滚动高度
    },
    chatAudio : function(){
        if ( $("#chatAudio").length <= 0 ) {
            $('<audio id="chatAudio"><source src="./static/voices/notify.ogg" type="audio/ogg"><source src="./static/voices/notify.mp3" type="audio/mpeg"><source src="./static/voices/notify.wav" type="audio/wav"></audio>').appendTo('body');
        }
        $('#chatAudio')[0].play();
    },
    mess:function(d){
                    if(d.mine){
                        server.addChatLine('mymessage',d);
                        $("#chattext").val('');
                    } else {
                        if(d.remains){
                            for(var i = 0 ; i < d.remains.length;i++){
                                if(server.fd == d.remains[i].fd){
                                    server.shake();
                                    var msg = d.name + "在群聊@了你。";
                                    server.displayError('chatErrorMessage_logout',msg,0);
                                }
                            }
                        }
                        server.chatAudio();
                        server.addChatLine('chatLine',d);
                        //增加消息
                        // chat.showMsgCount(d.roomid,'show');
                    }
        //增加消息
        // chat.showMsgCount(d.data.roomid,'show');
    },
    keySend : function( event ){
        if (event.ctrlKey && event.keyCode == 13) {
            $('#chattext').val($('#chattext').val() +  "\r\n");
        }else if( event.keyCode == 13){
            event.preventDefault();//避免回车换行
            server.wsSendMessage();
        }
    },
    }