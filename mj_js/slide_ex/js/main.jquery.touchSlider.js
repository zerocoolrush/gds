/* 
 * initPos :0,	디폴트 탭 위치
 * isRotate : 무한롤링 (기본값 true)
 * isFlex : 유동 레이아웃 true (기본값 false)
 * viewCnt : 다중컬럼 (기본값 1)
 * slideSpeed : 애니메이션 속도 (기본값 75)
 * slideRange : 넘김 판정 범위 (기본값 100)
 * nAngle : 슬라이드 허용 각도
 * nSlopTime : 슬라이드 후 다음 슬라이드 이벤트 발생 간격
 * btn_prev : prev 버튼 (jquery object, 기본값 false)
 * btn_next : next 버튼 (jquery object, 기본값 false)
 * btn_tab :'',	해당 버튼 jquery object(다중입력시 ":"로 구분)
 * btn_tabpos : '' 해당 버튼 클릭시 위치로 이동(다중입력시 ":"로 구분)
 * getPaging : function (e) { ... e.total ... e.current ... }
 * getTab : function (e) { ... e.totalid ... e.currentid ... } 해당 버튼 
 * beforeResize : function () { } 리사이즈&오리엔테이션 이벤트 전 함수
 * afterResize : function () { } 리사이즈&오리엔테이션 이벤트 후 리턴
 * example code :
 
	$("#target").touchSlider({
		isFlex : true
	});

*/
jQuery.fn.touchSlider = function (settings) {
	
	settings = jQuery.extend({
		initPos:0,
		isRotate : true,
		isFlex : true,
		slide : 'vertical',
		viewCnt : 1,
		slideSpeed : 75,
		slideRange : 50,
		nAngle : 25,
		nSlopTime : 100,
		btn_prev : false,
		btn_next : false,
		btn_tab :'',
		btn_tabpos : '',
		getPaging :false,
		getTab:false,
		beforeMove:false,
		beforeResize:false,
		afterResize:false
	}, settings);
	
	var opts = $.extend({}, $.fn.touchSlider.defaults, settings);
	
	return this.each(function () {
		var _this=this;

		this.opts = opts;
		this._Angle = 0;
		this._view = this.opts.viewCnt;
		this._speed = this.opts.slideSpeed;
		this._tg = $(this);
		this._list = this._tg.children().children();
		this._width = parseInt(this._tg.css("width"));
		this._height = parseInt(this._tg.css("height"));
		this._item_w = parseInt(this._list.css("width"));
		this._item_h = parseInt(this._list.css("height"));
		this._len = this._list.length;
		this._range = this.opts.slideRange; //this.opts.slideRange * this._width;
		this._pos = [];
		this._bak = [];
		this._start = [];
		this._startX = 0;
		this._startY = 0;
		this._left = 0;
		this._top = 0;
		this._nTimeX = 0;
		this._nTimeDis = 0;
		this._btn_prev;
		this._btn_next;
		this._isMoving=false;
		this._isStart=false;
		this._hasTouch = false;
		this._isLeftSwipe = false;
		this._MoveCnt = 0;

		this._onTouchInit = function() {
			this._hasTouch = ('ontouchstart' in window);

			//레이아웃 설정
			$(this).children().css({
				"width":this._width + "px",
				"overflow":"visible"
			});

			if(this.opts.slide=="horizental"){
				if(this._len > 1){
					if(this.opts.isFlex) this._item_h = this._height / this._view;
					if(this.opts.isRotate) this._len = Math.ceil(this._len / this._view) * this._view;
					for(var i=0; i<this._len; ++i) {
						this._pos[i] = this._item_h * i;
						this._start[i] = this._pos[i];
						this._list.eq(i).css({"float" : "none","display" : "block","position" : "absolute","left" : "0","top" : this._pos[i] + "px","width" : this._width + "px","height" : this._item_h + "px"});
					}
				}else{
					var cnt = Math.ceil(Math.ceil(this._len / this._view) * this._view);
					for(var i=0;i<cnt;i++){
						this._start[i]=this._height*i;
						this._pos[i]=this._start[i];
					}
				}
			}else{
				if(this.opts.isFlex) this._item_w = this._width / this._view;
				if(this.opts.isRotate) this._len = Math.ceil(this._len / this._view) * this._view;
				for(var i=0; i<this._len; ++i) {
					this._pos[i] = this._item_w * i;
					this._start[i] = this._pos[i];
					this._list.eq(i).css({"float" : "none","display" : "block","position" : "absolute","top" : "0","left" : this._pos[i] + "px","width" : this._item_w + "px"});
				}
			}

			//이전 다음 click bind
			if(this.opts.btn_prev && this.opts.btn_next) {
				this.opts.btn_prev.bind("click", function() {
					_this._onTouchAnimate(_this,1, true,false);
					return false;
				})
				this.opts.btn_next.bind("click", function() {
					_this._onTouchAnimate(_this,-1, true,false);
					return false;
				});
			}

			//Tab Position Click Bind
			if(this.opts.btn_tab != null && this.opts.btn_tab != ""){
				var pieces = this.opts.btn_tab.split(":");
				var tablen = pieces.length;
				for(var i=0;i<tablen;i++){
					$('#'+pieces[i]).bind("click", function(e) {
						var arr1 = _this.opts.btn_tab.split(":");
						var arr2 = _this.opts.btn_tabpos.split(":");
						for(var j=0;j<arr1.length;j++){
							if(arr1[j]==this.id) break;
						}
						var pos = (1-new Number(arr2[j]));
						_this._onTouchAnimate(_this,pos,true,true);
						_this._onTouchTabPos(_this,_this.id);
						return false;
					});
				}
			}

			//초기 위치 설정
			if(this.opts.initPos != 0){
				this._onTouchAnimate(this,-this.opts.initPos,false);
				var ps = this.opts.btn_tab.split(":");
				this._onTouchTabPos(this,ps[this.opts.initPos]);
			}
			this._onTouchCounter(this);
		};

		this._onTouchResize = function () {
			if(this.opts.isFlex) {
				if(typeof(this.opts.beforeResize) == "function"){
					this.opts.beforeResize();
				}

				if(this.opts.slide=="horizental"){
					var tmp_h = this._item_h;
					this._width = parseInt(this._tg.css("width"));
					this._height = parseInt(this._tg.css("height"));
					this._item_h = this._height / this._view;
					//this._range = this.opts.slideRange * this._height;
					if(this._len > 1){
						for(var i=0; i<this._len; ++i) {
							this._pos[i] = this._pos[i] / tmp_h * this._item_h;
							this._list.eq(i).css({"left" : "0","top" : this._pos[i] + "px","width" : this._width + "px","height" : this._item_h + "px"});
						}
					}else{
						this.cnt = Math.ceil(Math.ceil(this._len / this._view) * this._view);
						for(var i=0;i<this.cnt;i++){
							this._start[i]=this._height*i;
							this._pos[i]=this._start[i];
						}
					}
				}else{
					var tmp_w = this._item_w;
					this._width = parseInt(this._tg.css("width"));
					this._item_w = this._width / this._view;
					//this._range = this.opts.slideRange * this._width;
					for(var i=0; i<this._len; ++i) {
						this._pos[i] = this._pos[i] / tmp_w * this._item_w;
						this._list.eq(i).css({"left" : this._pos[i] + "px","width" : this._item_w + "px"});
					}
				}
				if(typeof(this.opts.afterResize) == "function"){
					this.opts.afterResize();
				}
			}
		};

		this._onRestore = function(msg){
			for(var i=0; i<this._len;++i) {
				this._start[i] = this._bak[i];
				this._pos[i] = this._bak[i];
				if(this.opts.slide=="horizental"){
					if(!this._hasTouch){this._list.eq(i).animate({"top": this._pos[i] + "px"}, this._speed);}else{this._list.eq(i).css({"top": this._pos[i] + "px"});}
				}else{
					if(!this._hasTouch){this._list.eq(i).animate({"left": this._pos[i] + "px"}, this._speed);}else{this._list.eq(i).css({"left": this._pos[i] + "px"});}
				}
			}
		}

		this._onTouchStart = function(e) {
			this._left = 0;
			this._top = 0;

			var t = e.originalEvent;
			if((e.type == "touchstart" && t.changedTouches.length == 1) || e.type == "dragstart") {
				this._startX = t.clientX || t.changedTouches[0].clientX;
				this._startY = t.clientY || t.changedTouches[0].clientY;
				this._start = [];
				for(var i=0; i<this._len;++i) {
					this._start[i] = this._pos[i];
					this._bak[i] = this._pos[i];
				}
				this._nTimeX = e.timeStamp;
				this._isStart = true;
				this._isLeftSwipe = false;
				this._MoveCnt = 0;
				if(this._hasTouch){
					this._tg.bind("touchmove", _this._onTouchMove);
					this._tg.bind("touchend", _this._onTouchEnd);
					this._tg.bind("touchcancel", _this._onTouchCancel);
				}

				//touchleave || mouseleave
				setTimeout(function() {
					if(_this._isLeftSwipe == true){
						_this._onTouchAnimate(_this,_this._onTouchDirection(),false);
						if(_this._hasTouch){
							_this._tg.unbind("touchmove");
							_this._tg.unbind("touchend");
							_this._tg.unbind("touchcancel");
						}
						_this._isLeftSwipe = false;
						_this._isMoving=false;
						_this._isStart=false;
						_this._nTimeX = 0;
						_this._nTimeDis = 0;
						_this._MoveCnt = 0;
					}
				}, 500);
			}
		};

		this._onTouchMove = function(e) {
			if(!this._isStart) {return;}
			this._isMoving=true;

			var t = e.originalEvent;
			if((e.type == "touchmove" && t.changedTouches.length <= 1) || e.type == "drag") {
				try{
					this._left = (t.clientX || t.changedTouches[0].clientX) - this._startX;
					this._top = (t.clientY || t.changedTouches[0].clientY) - this._startY;
					this._Angle =  Math.round(Math.atan(Math.abs(this._top) / Math.abs(this._left)) * 360 / (2 * Math.PI));
				
					if(this.opts.slide=="horizental"){
						this._nTimeDis = e.timeStamp - this._nTimeX;
						if(this._Angle > (90-this.opts.nAngle) && Math.abs(this._left) < Math.abs(this._top)) {
							e.preventDefault();
							if(this._range < Math.abs(this._top) && this._nTimeDis > this.opts.nSlopTime){
								if(typeof(this.opts.beforeMove) == "function" && this._MoveCnt==0){
									this._MoveCnt++;
									var param = {
										total : Math.ceil(_this._len / v._view),
										current : ($.inArray(0,_this._pos) / _this._view) + 1,
										dir:_this._onTouchDirection()
									};
									this.opts.beforeMove(param);
								}
								if(this._len > 1){
									this._onTouchPositionH(this,e, false);
									for(var i=0; i<this._len; ++i) {
										var tmp = this._start[i] + this._top;
										this._list.eq(i).css("top", tmp + "px");
										this._pos[i] = tmp;
										this._isLeftSwipe = true;
									}
								}else{
									var pos = $.inArray(0,this._start);
									var tmp = this._start[0] + this._top;
									var cid = $(this).children().attr("id");
									$('#'+cid).css("top", tmp + "px");
								}
							}
						}
					}else{
						this._nTimeDis = e.timeStamp - this._nTimeX;
						if( Math.abs(this._left) > Math.abs(this._top) || this._Angle < (90-this.opts.nAngle)) {
							e.preventDefault();
							if(this._range < Math.abs(this._left) && this._nTimeDis > this.opts.nSlopTime){
								if(typeof(this.opts.beforeMove) == "function" && this._MoveCnt==0){
									this._MoveCnt++;
									var param = {
										total : Math.ceil(_this._len / _this._view),
										current : ($.inArray(0,_this._pos) / _this._view) + 1,
										dir:_this._onTouchDirection()
									};
									this.opts.beforeMove(param);
								}
								this._onTouchPosition(this,e, false);
								for(var i=0; i<this._len; ++i) {
									var tmp = this._start[i] + this._left;
									this._list.eq(i).css("left", tmp + "px");
									this._pos[i] = tmp;
									this._isLeftSwipe = true;
								}
							}
						}
					}
				}catch(e){}
			}
		};

		this._onTouchCancel = function(e){
			//this._onRestore("_onTouchCancel Cancel");
			this._onTouchEnd(e);
		}

		this._onTouchEnd = function(e) {
			if(((e.type == "touchend" || e.type == "touchcancel") && e.originalEvent.changedTouches.length <= 1) || e.type == "dragend"){
				if(this._isStart && !this._isMoving) {		//클릭(탭) 이벤트로 판단
					 this._onRestore("_onTouchEnd Click");
				}else{										//드래그 및 터치 이벤트
					if(this.opts.slide=="horizental"){
						if(this._Angle > (90-this.opts.nAngle) && Math.abs(this._left) < Math.abs(this._top) && this._range < Math.abs(this._top)) {
							if(this._len > 1){
								if(this._bak.length != this._len){this._onRestore("_onTouchEnd Error Count");}else{this._onTouchAnimate(this,this._onTouchDirection(),false);}
							}else{
								var pos = $.inArray(0,this._start);
								var cid = $(this).children().attr("id");
								var dst = this._onTouchDirection()*this._height;
								var tmp = this._start[0]+dst;
								if((pos == 0 && dst > 0) || (pos ==(this._start.length-1) && dst < 0) ){
									$('#'+cid).animate({"top": this._start[0] + "px"}, this._speed);
								}else{
									$('#'+cid).animate({"top": tmp + "px"}, this._speed);
									for(var i=0; i<this._start.length;i++) {this._pos[i] = this._pos[i]+dst;}
								}
							}
						}else{
							this._onRestore("_onTouchEnd Scroll");
						}
					}else{
						if((Math.abs(this._left) > Math.abs(this._top) || this._Angle < (90-this.opts.nAngle)) && this._nTimeDis > this.opts.nSlopTime && this._range < Math.abs(this._left)) {
							if(this._bak.length != this._len){this._onRestore("_onTouchEnd Error Count");}else{this._onTouchAnimate(this,this._onTouchDirection(),false);}
						}else{
							this._onRestore("_onTouchEnd Scroll");
						}
					}
				}
			}else{
				this._onRestore("_onTouchEnd aa");
			}
			if(this._hasTouch){
				this._tg.unbind("touchmove");
				this._tg.unbind("touchend");
				this._tg.unbind("touchcancel");
			}
			this._isMoving=false;
			this._isStart=false;
			this._isLeftSwipe = false;
			this._nTimeX = 0;
			this._nTimeDis = 0;
			this._MoveCnt = 0;
		};

		this._onTouchAnimate = function(_self,d, btn_click, ispos) {
			var isError=false;
			if(this.opts.slide=="horizental"){
				if(btn_click) _self._onTouchPositionH(_self,d, ispos);
				var gap = d * (_self._item_h * _self._view);
				for(var i=0; i<_self._len; ++i) {
					_self._pos[i] = _self._start[i] + gap;
					if(Math.abs(_self._pos[i]) >= _self._item_h*_self._len || (_self._pos[i]%_self._item_h) != 0){isError=true;break;}
					if(!_self._hasTouch && btn_click){__self._list.eq(i).animate({"top": _self._pos[i] + "px"}, _self._speed);}else{_self._list.eq(i).css({"top": _self._pos[i] + "px"});}
				}
			}else{
				if(btn_click) _self._onTouchPosition(_self,d, ispos);
				var gap = d * (_self._item_w * _self._view);
				for(var i=0; i<_self._len; ++i) {
					_self._pos[i] = _self._start[i] + gap;
					if(Math.abs(_self._pos[i]) >= _self._item_w*_self._len || (_self._pos[i]%_self._item_w) != 0){isError=true;break;}
					if(!_self._hasTouch && btn_click){_self._list.eq(i).animate({"left": _self._pos[i] + "px"}, _self._speed);}else{_self._list.eq(i).css({"left": _self._pos[i] + "px"});}
				}
			}
			if(isError){_self._onRestore("_onTouchEnd Error _onTouchAnimate");}else{_self._onTouchCounter(_self);}
		};

		this._onTouchDirection = function() {
			var r = 0;
			if(this.opts.slide=="horizental"){
				if(this._Angle > (90-this.opts.nAngle) && Math.abs(this._left) < Math.abs(this._top)) {
					if(this._top < 0) r = -1;
					else if(this._top > 0) r = 1;
				}
			}else{
				if(Math.abs(this._left) > Math.abs(this._top)) {
					if(this._left < 0) r = -1;
					else if(this._left > 0) r = 1;
				}
			}
			return r;
		};

		this._onTouchPosition = function(_self,d, ispos) {
			var gap = _self._view * _self._item_w;
			if(ispos){
				
				for(var i=0; i<_self._len;i++) {
					_self._pos[i] =  _self._item_w * i;
				}

				_self._startX = 0;
				_self._start = [];
				for(var i=0; i<_self._len; ++i) {
					_self._start[i] = _self._pos[i];
				}
				this._left = d * gap;
			}else{
				if(d == -1 || d == 1) {
					_self._startX = 0;
					_self._start = [];
					for(var i=0; i<_self._len; ++i) {
						_self._start[i] = _self._pos[i];
					}
					_self._left = d * gap;
				} else {
					if(_self._left > gap) _self._left = gap;
					else if(_self._left < -gap) _self._left = -gap;
				}
			}
			if(_self.opts.isRotate) {
				var tmp_pos = [];
				for(var i=0; i<_self._len; ++i) {
					tmp_pos[i] = _self._pos[i];
				}

				/* 해당 배열중 최소 최대 값 구하기 */
				tmp_pos.sort(function(a,b){return a-b;});
				var max_chk = tmp_pos[_self._len-_self._view];
				var p_min = $.inArray(tmp_pos[0], _self._pos);
				var p_max = $.inArray(max_chk, _self._pos);

				//한화면에 보여줄 갯수가 1보다 작거나 같은 경우 전체 길이 빼기1
				if(_self._view <= 1){max_chk = _self._len - 1;}	

				if(d == 1 || tmp_pos[0] > 0) {
					for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
						_self._start[p_max] = _self._start[p_min] - gap;
					}
				} else if(d == -1 || tmp_pos[max_chk] < 0) {
					for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
						_self._start[p_min] = _self._start[p_max] + gap;
					}
				}else if(tmp_pos[0] == 0){
					if(typeof(d) != "number" && _self._len > 2){
						for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
							_self._start[p_max] = _self._start[p_min] - gap;
						}
					}
				}else if(tmp_pos[max_chk] == 0){
					if(typeof(d) != "number"){
						for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
							_self._start[p_min] = _self._start[p_max] + gap;
						}
					}
				}
			} else {
				var last_p = parseInt((_self._len - 1) / _self._view) * _self._view;
				if(	(_self._start[0] == 0 && _self._left > 0) || (_self._start[last_p] == 0 && _self._left < 0) ) _self._left = 0;
			}
		};

		this._onTouchPositionH = function(_self,d, ispos) {
			var gap = _self._view * _self._item_h;
			if(ispos){
				
				for(var i=0; i<_self._len;i++) {
					_self._pos[i] =  _self._item_h * i;
				}

				_self._startY = 0;
				_self._start = [];
				for(var i=0; i<_self._len; ++i) {
					_self._start[i] = _self._pos[i];
				}
				this._top = d * gap;
			}else{
				if(d == -1 || d == 1) {
					_self._startY = 0;
					_self._start = [];
					for(var i=0; i<_self._len; ++i) {
						_self._start[i] = _self._pos[i];
					}
					_self._top = d * gap;
				} else {
					if(_self._top > gap) _self._top = gap;
					else if(_self._top < -gap) _self._top = -gap;
				}
			}
			if(_self.opts.isRotate) {
				var tmp_pos = [];
				for(var i=0; i<_self._len; ++i) {
					tmp_pos[i] = _self._pos[i];
				}
				tmp_pos.sort(function(a,b){return a-b;});
				
				var max_chk = tmp_pos[_self._len-_self._view];
				var p_min = $.inArray(tmp_pos[0], _self._pos);
				var p_max = $.inArray(max_chk, _self._pos);
				
				if(_self._view <= 1) max_chk = _self._len - 1;
		
				if(d == 1 || tmp_pos[0] > 0) {
					for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
						_self._start[p_max] = _self._start[p_min] - gap;
					}
				} else if(d == -1 || tmp_pos[max_chk] < 0) {
					for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
						_self._start[p_min] = _self._start[p_max] + gap;
					}
				}else if(tmp_pos[0] == 0){
					if(typeof(d) != "number"){
						for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
							_self._start[p_max] = _self._start[p_min] - gap;
						}
					}
				}else if(tmp_pos[max_chk] == 0){
					if(typeof(d) != "number"){
						for(var i=0; i<_self._view; ++i, ++p_min, ++p_max) {
							_self._start[p_min] = _self._start[p_max] + gap;
						}
					}
				}
			} else {
				var last_p = parseInt((_self._len - 1) / _self._view) * _self._view;
				if(	(_self._start[0] == 0 && _self._top > 0) || (_self._start[last_p] == 0 && _self._top < 0) ) _self._left = 0;
			}
		};

		this._onTouchCounter = function(_self){
			if(typeof(_self.opts.getPaging) == "function") {
				var param = {
					total : Math.ceil(_self._len / _self._view),
					current : ($.inArray(0,_self._pos) / _self._view) + 1,
					dir:this._onTouchDirection()
				};
				_self.opts.getPaging(param);
			}
		};

		this._onTouchTabPos = function(_self,id){
			if(typeof(_self.opts.getTab) == "function") {
				var param = {
					totalid : _self.opts.btn_tab,
					currentid : id
				};
				_self.opts.getTab(param);
			}
		};



		//초기화
		this._onTouchInit();

		//이벤트 바인드
		if(this._hasTouch){
			this._tg.bind("touchstart", this._onTouchStart);
		}else{
			this._tg.bind("dragstart", this._onTouchStart);
			this._tg.bind("drag", this._onTouchMove)
			this._tg.bind("dragend", this._onTouchEnd)
		}
		var supportsOrientationChange = "onorientationchange" in window,orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
		try{
			window.addEventListener(orientationEvent, function(e) {
				setTimeout(function(){_this._onTouchResize();},300);
			}, false);
		}catch(e){
			window.attachEvent(orientationEvent, function(e) {
				setTimeout(function(){_this._onTouchResize();},300);
			}, false);
		}

	});
}