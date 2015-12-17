/**
 * @namespace 立体翻页插件
 * Created by levin on 14/12/3.
 * 立体翻页插件，原理：三个页容器轮换，只替换其内容。
 * 此插件依赖的库：zepto.js 、$touch.js;
 */

;(function(root){
    "use strict";
    /**
     * @method _slideAnimation
     * @param obj
     * @param _transition css transition属性
     * @param _transform css translate3d属性
     * @param _zIndex css z-index属性
     * @private
     * @desc DOM对象的滑动动画
     */
    var _slideAnimation= function(obj,_transition,_transform,_zIndex){
        if(!obj){
            return;
        }
        obj.css({'-webkit-transition':_transition,'-webkit-transform':_transform,'z-index' : _zIndex});
        obj.css({'transition':_transition,'transform':_transform,'z-index' : _zIndex});
    };

    /**
     * @method _transEndFuc
     * @param e
     * @private
     * @desc 翻页动画结束执行页面内容动画的方法
     */
    var _transEndFuc = function(e){
        e.stopPropagation();
        this.sceneAnimateEnd && this.sceneAnimateEnd();
    };

    /**
     * @class _SlipPage
     * @param wrap 存放页面结构的容器对象
     * @param scenes 页面场景数组对象分为3个属性：htm->页面内容字符串；initial->页面初始化方法，可以处理页面结构或绑定事件；animation->页面内容展示的动画或动画结束事件的处理；
     * @example     例如：scenes = [{
     *
     *                         //页面内容字符串
     *                         htm:'<h1 class="title">first page</h1>',
     *
     *                         //页面初始化方法，可以处理页面结构或绑定事件
     *                         initial:function(){
     *                              var $h1 = $('#section0').find('h1');
     *                              $h1.on('click',function(){
     *                                  alert("what's up man?");
     *                              });
     *                          },
     *
     *                          //页面显示时执行动画或动画结束事件
     *                          animation:function(){
     *                              var $h1 = $('#section0').find('h1');
     *                              $h1.addClass('rubberBand');
     *                              $h1.bind('webkitAnimationEnd',function(){
     *                                  $(this).removeClass('rubberBand').addClass('normal-animate-end');
     *                              });
     *                          }
     *
     *                      }];
     * @param isLoop
     * @param beginSceneIndex
     * @private
     */
    var _SlipPage = function(wrap,scenes,isLoop,beginSceneIndex){
        //页面下标
        this.curPageIndex = 0;
        //场景下标
        this.curSceneIndex = beginSceneIndex || 0;
        //场景对象数组
        this.scenes = scenes;
        //正在滑动标识
        this.moved = false;
        //是否轮翻
        this.isLoop = !!isLoop;
        //容器对象
        this.$wrapEl = $(wrap);
        //页面对象数组
        this.pages = null;
        //翻页的方向
        this.direct ='forward';
        //页面高度
        this.pageHeight = 0;
        //标准z-index
        this.zIndex = 100;
        //轮翻的三个页面
        this.curPage = this.targetPage = this.otherPage = null;
        //初始化方法
        this._initial();
    };

    /**
     * @desc SlipPage类的原型对象
     * @type {{constructor: _SlipPage, _initial: _initial, _renderPages: _renderPages, _fillSceneInPage: _fillSceneInPage, moveStart: moveStart, moveOn: moveOn, goBack: goBack, next: next, prev: prev, getThirdIndex: getThirdIndex, sceneAnimateEnd: sceneAnimateEnd}}
     */
    _SlipPage.prototype = {

        constructor : _SlipPage,

        /**
         * @method _initial
         * @private
         * @desc 实例化初始方法
         */
        _initial : function(){
            this._renderPages();
            this.pageHeight = this.$wrapEl.height();
            var _curIndex = this.curPageIndex,
                _targetIndex = _curIndex + 1,
                _otherIndex = _targetIndex + 1;
            this.curPage = $(this.pages[_curIndex]);
            this.targetPage = $(this.pages[_targetIndex]);
            this.otherPage = $(this.pages[_otherIndex]);
            _slideAnimation(this.curPage,'all 0s ease-out','translate3d(0px,0px,0px) scale(1)',this.zIndex+1);
            _slideAnimation(this.targetPage,'all 0s ease-out','translate3d(0px,' + this.pageHeight + 'px,0px)',this.zIndex-1);
            _slideAnimation(this.otherPage,'all 0s ease-out','translate3d(200%,200%,0px)',-1);
            this.sceneAnimateEnd();
        },

        /**
         * @method _renderPages
         * @private
         * @desc 渲染页面结构
         */
        _renderPages : function(){
            var _htm = '',
                that = this,
                len = this.scenes.length,
                curIndex = this.curSceneIndex;
            if(!len||len <=2){
                console.log('Error: the scenes data is not array or scene numbers are less than 3!');
            }
            //将所有场景内容添加section包装
            that.scenes.forEach(function(val,index){
                that.scenes[index].htm = '<section id="section' + index + '" class="section">' + val['htm'] + '</section>';
            });
            var showedScenes = [];
            //取出三个场景内容放进三个页面容器中
            for(var i=0;i<3;i++){
                if(curIndex >= len){
                    curIndex = 0;
                }
                _htm +='<div class="page p'+i+'">'+that.scenes[curIndex].htm+'</div>';
                showedScenes.push(that.scenes[curIndex]);
                curIndex ++;
            }
            this.$wrapEl.html(_htm);
            this.pages = this.$wrapEl.find('.page');
            //页面容器的touch事件
            this.pages.touch({
                //滑动距离
                absDist:100,
                //touch start方法
                start:function(){
                    that.moveStart.apply(that,arguments);
                },
                //滑动中的方法
                moving:function(){
                    that.moveOn.apply(that,arguments);
                },
                //向上滑动结束方法
                top:function(){
                    that.next.apply(that,arguments);
                },
                //向下滑动结束方法
                bottom:function(){
                    that.prev.apply(that,arguments);
                },
                //滑动没有超过设定的滑动距离，恢复原样的方法
                resume:function(){
                    that.goBack.apply(that,arguments);
                }
            });

            //对三个即将show的场景进行初始化
            showedScenes.forEach(function(val){
                val.initial && val.initial();
            });
        },

        /**
         * @method _fillSceneInPage
         * @param page 页面容器对象
         * @param index 场景组标中的下标
         * @private
         * @desc 将场景内容填充到页面容器
         */
        _fillSceneInPage : function(page,index){
            if(!page){
                return;
            }
            var _$section = page.find('.section'),
                _scene = this.scenes[index];
            if(!_$section.length){
                page.html(_scene.htm);
                _scene.initial && _scene.initial();
                return;
            }
            //如果页面容器的中的场景对象的id与要填充的场景id相同的情况
            if(_$section.attr('id') == 'section'+index){
                return;
            }
            page.html(_scene.htm);
            _scene.initial && _scene.initial();
        },

        /**
         * @method moveStart
         * @desc 滑动启始方法
         */
        moveStart : function(){
            if(this.moved){
                return;
            }
            this.curPage = $(this.pages[this.curPageIndex]);
        },

        /**
         * @method moveOn
         * @param x 水平方向的滑动位移差
         * @param y 垂直方向的滑动位移差
         * @desc 滑动过程方法
         */
        moveOn : function(x,y){
            var _curPgIndex,_otherPgIndex,_curSceneIndex,_scenesLen;
            //滑动的方向forward->向下；back->向上；
            this.direct = y > 0 ? 'forward' : 'back';
            //是否是滑动过程中
            if(!this.moved){
                _curPgIndex = this.curPageIndex;
                _curSceneIndex = this.curSceneIndex;
                _scenesLen = this.scenes.length-1;
                if(this.direct == 'forward'){
                    if(this.isLoop){
                        this.curSceneIndex = _curSceneIndex == _scenesLen ? 0 : _curSceneIndex + 1;
                    }else{
                        if(_curSceneIndex == _scenesLen){
                            return;
                        }
                        this.curSceneIndex = _curSceneIndex  + 1;
                    }
                    this.curPageIndex = _curPgIndex == 2 ? 0 : _curPgIndex + 1 ;

                }else{
                    if(this.isLoop){
                        this.curSceneIndex = _curSceneIndex == 0 ? _scenesLen : _curSceneIndex - 1;
                    }else{
                        if(_curSceneIndex == 0){
                            return;
                        }
                        this.curSceneIndex = _curSceneIndex -1;
                    }
                    this.curPageIndex = _curPgIndex == 0 ? 2 : _curPgIndex - 1 ;
                }
                _otherPgIndex = this.getThirdIndex(_curPgIndex,this.curPageIndex);
            }
            //目标页面
            this.targetPage = $(this.pages[this.curPageIndex]);
            //第三个页面
            this.otherPage = $(this.pages[_otherPgIndex]);

            if(!this.moved){
                this._fillSceneInPage(this.targetPage,this.curSceneIndex);
            }
            //页面缩放比例、垂直滑动距离
            var _scaleDis,_yDis;
            if(this.direct == 'forward'){
                _scaleDis = 1-0.2*y/this.pageHeight;
                _yDis = this.pageHeight-Math.floor(y/2);
                _slideAnimation(this.curPage,'all 0s ease-out','translate3d(0px,0px,0px) scale('+_scaleDis+')',this.zIndex-2);
                _slideAnimation(this.targetPage,'all 0s ease-out','translate3d(0px,'+ _yDis +'px,0px)',this.zIndex+2);
                _slideAnimation(this.otherPage,'all 0s ease-out','translate3d(200%,200%,0px)',-1);

            }else{
                _scaleDis = 0.8 + 0.2 * Math.abs(y)/this.pageHeight;
                _yDis = Math.floor(y/2);
                $('#pageX').text(_scaleDis);
                _slideAnimation(this.curPage,'all 0s ease-out','translate3d(0px,'+ Math.abs(_yDis) +'px,0px)',this.zIndex+1);
                _slideAnimation(this.targetPage,'all 0s ease-out','translate3d(0px,0px,0px) scale('+_scaleDis+')',this.zIndex-1);
                _slideAnimation(this.otherPage,'all 0s ease-out','translate3d(200%,200%,0px)',-1);
            }
            this.moved = true;
        },

        /**
         * @method goBack
         * @desc 恢复原样
         */
        goBack : function(){
            if(!this.moved){
                return;
            }
            this.moved = false;
            var _curPageIndex = this.curPageIndex,
                _scenesLen = this.scenes.length-1,
                _curSceneIndex = this.curSceneIndex;
            if(this.direct == 'forward'){
                this.curPageIndex = _curPageIndex == 0 ? 2 : _curPageIndex - 1 ;
                _slideAnimation(this.curPage,'all .3s ease-out','translate3d(0px,0px,0px) scale(1)',this.zIndex+1);
                _slideAnimation(this.targetPage,'all .3s ease-out','translate3d(0px,'+this.pageHeight+'px,0px)',this.zIndex-1);
                this.curSceneIndex = _curSceneIndex == 0 ? _scenesLen : _curSceneIndex - 1;
                return;
            }
            this.curPageIndex = _curPageIndex == 2 ? 0 : _curPageIndex + 1 ;
            this.curSceneIndex = _curSceneIndex == _scenesLen ? 0 : _curSceneIndex + 1;
            _slideAnimation(this.curPage,'all .3s ease-out','translate3d(0px,0px,0px)',this.zIndex+1);
            _slideAnimation(this.targetPage,'all .3s ease-out','translate3d(0px,0px,0px)  scale(0.8)',this.zIndex-1);
        },

        /**
         * @method next
         * @desc 展示下一页
         */
        next:function(){
            if(!this.moved){
                return;
            }
            this.moved = false;
            var that = this;
            var func = function(e){
                _transEndFuc.apply(that,arguments);
                $(this).off({'webkitTransitionEnd':func,'transitionEnd':func});
            };
            this.targetPage.on({'webkitTransitionEnd':func,'transitionEnd':func});
            _slideAnimation(this.curPage,'all .3s ease-out','translate3d(0px,0px,0px)  scale(0.8)',this.zIndex-2);
            _slideAnimation(this.targetPage,'all .3s ease-out','translate3d(0px,0px,0px)',this.zIndex+2);
            _slideAnimation(this.otherPage,'all 0s ease-out','translate3d(200%,200%,0px)',-1);
        },

        /**
         * @method prev
         * @desc 展示上一页
         */
        prev:function(){
            if(!this.moved){
                return;
            }
            this.moved = false;
            var that = this;
            var func = function(e){
                _transEndFuc.apply(that,arguments);
                $(this).off({'webkitTransitionEnd':func,'transitionEnd':func});
            };
            this.targetPage.on({'webkitTransitionEnd':func,'transitionEnd':func});
            _slideAnimation(this.curPage,'all .3s ease-out','translate3d(0px,'+ this.pageHeight +'px,0px)',this.zIndex+2);
            _slideAnimation(this.targetPage,'all .3s ease-out','translate3d(0px,0px,0px) scale(1)',this.zIndex-2);
            _slideAnimation(this.otherPage,'all 0s ease-out','translate3d(200%,200%,0px)',-1);

        },

        /**
         * @method getThirdIndex
         * @param first 当前页下标
         * @param second 目标页下标
         * @returns {number} 第三个页面的下标
         * @desc 获取第三页的下标，（因为在滑动过程中，共有三个页面在轮换，只操作当页和目标页，通过两个页的下标获取第三页的下标）
         *       例如：arr = [0,1,2];
         *            如果，当前页的下标是1，下滑，目标页的下标是2，那么可以获得第三页的下标是0
         *            如果，当前页的下标是1，上滑，目标页的下标是0，那么可以获得第三页的下标是2
         *            主要是为了方便获得第三页面对象进行设置其显示逻辑
         */
        getThirdIndex : function(first,second){
            var arr = [0,1,2];
            for(var i = 0,l=arr.length;i<l;i++){
                if(i!= first && i!= second){
                    return i;
                }
            }
        },

        /**
         * @method scenesAnimateEnd
         * @desc 页面滑动动画完成后的操作
         */
        sceneAnimateEnd : function(){
            var _curSceneIndex = this.curSceneIndex,
                _curScene = this.scenes[_curSceneIndex];
            if(_curScene){
                _curScene.animation && _curScene.animation();
            }
        }
    };

    root.slipPage = function(wrap,scenes,isLoop,beginSceneIndex){
        return new _SlipPage(wrap,scenes,isLoop,beginSceneIndex);
    };

})(window.plugin || (window.plugin = {}));