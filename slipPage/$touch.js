/**
 * Created by levin on 14/12/3.
 * 主要是解决了移动端的touch事件，避免了过多的touchStart、touchMove、touchEnd的组合事件。
 * 此库依赖于zepto.js、jquery.js
 * 使用方法：$('#div').touch({
 *              //触摸事件开始方法
 *              start:func,
 *              //触摸事件滑动方法
 *              moving:func,
 *              //以下五种触摸事件结束方法
 *              //触摸以向上滑动结束
 *              top:func,
 *              //触摸以向左滑动结束
 *              left:func,
 *              //触摸以向右滑动结束
 *              right:func,
 *              //触摸以向下滑动结束
 *              bottom:func,
 *              //触摸以纯粹的点击结束
 *              tap:func，
 *              //取消阻止默认事件
                cancelPrevDef:false,
                //滑动的间距，超过这个数值，才会触发top、left、right、bottom方法；默认为20
                absDist:20
 *          })
 */
;(function(){
    "use strict";

    /**
     * @method _addHandler
     * @param obj 要绑定事件的DOM对象
     * @param type touch事件类型
     * @param fn 事件trigger的方法
     * @private
     * @desc 为DOM对象绑定事件
     */
    var _addHandler = function(obj,type,fn){
        if(obj.attachEvent){
            obj.attachEvent('on'+type,fn);
        }else if(obj.addEventListener){
            obj.addEventListener(type,fn,false);
        }else{
            obj["on"+type] = fn;
        }
    };

    /**
     * @method _bindFn
     * @private
     * @param obj
     * @param fn
     * @returns {Function}
     * @desc 改变绑定事件方法的上下文
     */
    var _bindFn = function(obj,fn){
        return function(){
            fn.apply(obj,arguments);
        }
    };
    /**
     * @method _func
     * @private
     * @desc 匿名空方法
     */
    var _func = function(){};

    //默认配置
    /*var _conf = {
        //触摸事件开始方法
        start : _func,
        //触摸事件滑动方法
        moving: _func,
        //触摸以向上滑动结束
        top : _func,
        //触摸以向左滑动结束
        left:_func,
        //触摸以向右滑动结束
        right:_func,
        //触摸以向下滑动结束
        bottom:_func,
        //触摸滑动距离没有超过设定间距，那么归位方法
        resume:null,
        //触摸以纯粹的点击结束
        tap:_func,
        //取消阻止默认事件
        cancelPrevDef:false,
        //滑动的间距，超过这个数值，才会触发top、left、right、bottom方法；默认为20
 	    //阻止冒泡
        stopPropagation:false,
        absDist:20
    };*/

    /**
     * @class Touch
     * @param $target zepto或jquery对象
     * @param option 触摸阶段的方法
     * @constructor
     * @desc Touch类
     */
    var Touch = function($target,option){
        //如果目标参数对为空或不存在的情况
        if(!$target || (!$target.length)){
            return;
        }
        //zepto或jquery对象
        this.$el=null;
        //滑动起点坐标
        this.startX=0;
        this.startY=0;
        //滑动轨迹位置
        this.transX=0;
        this.transY=0;
        this._config = $.extend({
            //触摸事件开始方法
            start : _func,
            //触摸事件滑动方法
            moving: _func,
            //触摸以向上滑动结束
            top : _func,
            //触摸以向左滑动结束
            left:_func,
            //触摸以向右滑动结束
            right:_func,
            //触摸以向下滑动结束
            bottom:_func,
            //触摸滑动距离没有超过设定间距，那么归位方法
            resume:null,
            //触摸以纯粹的点击结束
            tap:_func,
            //取消阻止默认事件
            cancelPrevDef:false,
            //滑动的间距，超过这个数值，才会触发top、left、right、bottom方法；默认为20
            //阻止冒泡
            stopPropagation:false,
            absDist:20
        }, option);
        //类的初始化方法
        this.initial($target);
    };

    //Touch类的原型对象
    Touch.prototype = {

        //引用指向
        constructor:Touch,

        /**
         * @method initial
         * @param $target
         * @returns {*|jQuery|HTMLElement}
         * @Touch类的初始化方法
         */
        initial: function ($target) {
            this.$el = $target;
            _addHandler(this.$el[0],"touchstart",_bindFn(this,this.touch_start));
            _addHandler(this.$el[0],"touchmove",_bindFn(this,this.touch_move));
            _addHandler(this.$el[0],"touchend",_bindFn(this,this.touch_end));
            return $(this);
        },

        /**
         * @method touch_start
         * @param e
         * @desc 触摸启始方法
         */
        touch_start : function(e){
            if(!event.touches.length) return;
            var touch = event.touches[0];
            this.startX = touch.pageX;
            this.startY = touch.pageY;
            this.transX = 0;
            this.transY = 0;
            this._config.start && this._config.start();
        },

        /**
         * @method touch_move
         * @param e
         * @desc 触摸滑动方法
         */
        touch_move : function(e){
            //取消阻止默认事件标识为false的情况
            if(!this._config.cancelPrevDef){
                e.preventDefault();
            }
            if(!event.touches.length) return;
            var touch = event.touches[0];
            this.transX = this.startX-touch.pageX;
            this.transY = this.startY-touch.pageY;
            this._config.moving && this._config.moving(this.transX,this.transY);
        },

        /**
         * @method touch_end
         * @param e
         * @desc 触摸结束方法
         */
        touch_end : function(e){
 	        if(this._config.stopPropagation){
                e.stopPropagation();
            }
            var absX = Math.abs(this.transX),
                absY = Math.abs(this.transY),
                conf = this._config,
                absDist = conf.absDist,
                obj = this.$el[0];
            if(absX < 2 && absY < 2){
                conf.tap && conf.tap.apply(obj,arguments);
                return;
            }
            if((absX/2) > absDist && absX > absY){
                if(this.transX < 0){
                    conf.right && conf.right.apply(obj,arguments);
                    return;
                }
                conf.left && conf.left.apply(obj,arguments);
                return;
            }
            if((absY/2) > absDist && absY > absX){
                if(this.transY < 0){
                    conf.bottom && conf.bottom.apply(obj,arguments);
                    return;
                }
                conf.top && conf.top.apply(obj,arguments);
                return;
            }
            conf.resume && conf.resume.apply(obj,arguments);
        }

    };

    //绑定touch实例方法到zepto或jquery原型对象上
    (function($) {
        $.fn.touch = function(b) {
            return this.each(function() {
                $(this).data("touch", new Touch($(this), b))
            })
        }
    })(window.jQuery || window.Zepto)

})();