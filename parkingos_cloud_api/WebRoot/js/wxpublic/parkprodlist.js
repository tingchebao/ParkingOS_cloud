var OFFSET = 5;
var page = 1;
var PAGESIZE = 9999;

var myScroll,
	pullDownEl, pullDownOffset,
	pullUpEl, pullUpOffset,
	generatedCount = 0;
var maxScrollY = 0;

var hasMoreData = false;
var today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today/1000 + 24*60*60;//当天初始时间
var openid;

document.addEventListener('touchmove', function(e) {
	e.preventDefault();
}, false);

document.addEventListener('DOMContentLoaded', function() {
	$(document).ready(function() {
		var mobile=$("#mobile")[0].value;
		openid=$("#openid")[0].value;
		loaded(mobile,openid);
	});
}, false);

function loaded(mobile,openid) {
	pullDownEl = document.getElementById('pullDown');
	pullDownOffset = pullDownEl.offsetHeight;
	pullUpEl = document.getElementById('pullUp');
	pullUpOffset = pullUpEl.offsetHeight;

	hasMoreData = false;
	// $("#thelist").hide();
	$("#pullUp").hide();

	pullDownEl.className = 'loading';
	pullDownEl.querySelector('.pullDownLabel').innerHTML = '加载中...';

	page = 1;
	$.post("carowner.do", {
			"page": page,
			"pagesize": PAGESIZE,
			"mobile" : mobile,
			"action" : "products"
		},
		function(response, status) {
			if (status == "success") {
				$("#thelist").show();

				if (response.length < PAGESIZE) {
					hasMoreData = false;
					$("#pullUp").hide();
				} else {
					hasMoreData = true;
					$("#pullUp").show();
				}

				// document.getElementById('wrapper').style.left = '0';

				myScroll = new iScroll('wrapper', {
					useTransition: true,
					topOffset: pullDownOffset,
					onRefresh: function() {
						if (pullDownEl.className.match('loading')) {
							pullDownEl.className = 'idle';
							pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
							this.minScrollY = -pullDownOffset;
						}
						if (pullUpEl.className.match('loading')) {
							pullUpEl.className = 'idle';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
						}
					},
					onScrollMove: function() {
						if (this.y > OFFSET && !pullDownEl.className.match('flip')) {
							pullDownEl.className = 'flip';
							pullDownEl.querySelector('.pullDownLabel').innerHTML = '松手开始刷新...';
							this.minScrollY = 0;
						} else if (this.y < OFFSET && pullDownEl.className.match('flip')) {
							pullDownEl.className = 'idle';
							pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
							this.minScrollY = -pullDownOffset;
						} 
						if (this.y < (maxScrollY - pullUpOffset - OFFSET) && !pullUpEl.className.match('flip')) {
							if (hasMoreData) {
								this.maxScrollY = this.maxScrollY - pullUpOffset;
								pullUpEl.className = 'flip';
								pullUpEl.querySelector('.pullUpLabel').innerHTML = '松手开始刷新...';
							}
						} else if (this.y > (maxScrollY - pullUpOffset - OFFSET) && pullUpEl.className.match('flip')) {
							if (hasMoreData) {
								this.maxScrollY = maxScrollY;
								pullUpEl.className = 'idle';
								pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
							}
						}
					},
					onScrollEnd: function() {
						if (pullDownEl.className.match('flip')) {
							pullDownEl.className = 'loading';
							pullDownEl.querySelector('.pullDownLabel').innerHTML = '加载中...';
							// pullDownAction(); // Execute custom function (ajax call?)
							refresh();
						}
						if (hasMoreData && pullUpEl.className.match('flip')) {
							pullUpEl.className = 'loading';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '加载中...';
							// pullUpAction(); // Execute custom function (ajax call?)
							nextPage();
						}
					}
				});

				$("#thelist").empty();
				$.each(response, function(key, value) {
					var state = value.state;//0：未开始 1:使用中 2已过期
					var cname = value.name;//停车场名称
					var pname = value.parkname;//套餐名称
					var price = value.price;//套餐单价
					var prodid = value.prodid;
					var limitdate = "有效期 " + value.limitdate;//有效期
					var limittime = "可用时间："+ value.limittime;//有效时段
					var limitday = value.limitday;//剩余天数
					
					var money_class = "money";
					var ticketname_class = "ticketname";
					var ticketinfo_class = "ticketinfo";
					var ticketlimit_class = "normal";
					var line_class = "line";
					var useinfo_class = "useinfoused";
					
					var guoqi = "未使用";
					if(state == 1){
						guoqi = "使用中";
					}else if(state == 2){
						guoqi = "已过期";
						money_class = "moneyused";
						ticketname_class = "ticketnameused";
						ticketinfo_class = "ticketinfoused";
						ticketlimit_class = "normalused";
						line_class = "lineuesd";
						useinfo_class = "useinfoexp";
					}
					var click=' onclick="rewand('+prodid+')"';
					$("#thelist").append('<li '+click+' class="li1"><div class="moneyouter"><span class="'+money_class+'">'+price+'<span class="fuhao">元</span></span></div><a class="a1" href="#"><div class="'+ticketname_class+'">'+
							pname+'</div><div class="'+ticketinfo_class+'">'+limittime+'</div><div class="ticketlimit"><span class="sel_fee '+ticketlimit_class+'">'+cname+'</span></div></a><div class="rewand">续费</div></li>');
					$("#thelist").append('<li class="li2"><div class="'+line_class+'"></div><a class="a2" href="#"><div class="'+useinfo_class+'">'+guoqi+'</div><div class="limittime">'+limitdate+'</div></a></li>');
					
				});
				myScroll.refresh(); 
				if(response.length == 0){
					$(".middle").removeClass("hide");
				}
				if (hasMoreData) {
					myScroll.maxScrollY = myScroll.maxScrollY + pullUpOffset;
				} else {
					myScroll.maxScrollY = myScroll.maxScrollY;
				}
				maxScrollY = myScroll.maxScrollY;
			};
		},
		"json");
}
function rewand(prodid){
	var url = "wxpaccount.do?action=tobuyprod&openid="+openid+"&prodid="+prodid+"&type=1";
	window.location.href = url;
}
function refresh() {
	var mobile=$("#mobile")[0].value;
	page = 1;
	$.post("carowner.do", {
		"page": page,
		"pagesize": PAGESIZE,
		"mobile" : mobile,
		"action" : "products"
	},
	function(response, status) {
		if (status == "success") {
			$("#thelist").show();

			if (response.length < PAGESIZE) {
				hasMoreData = false;
				$("#pullUp").hide();
			} else {
				hasMoreData = true;
				$("#pullUp").show();
			}

			// document.getElementById('wrapper').style.left = '0';

			myScroll = new iScroll('wrapper', {
				useTransition: true,
				topOffset: pullDownOffset,
				onRefresh: function() {
					if (pullDownEl.className.match('loading')) {
						pullDownEl.className = 'idle';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
						this.minScrollY = -pullDownOffset;
					}
					if (pullUpEl.className.match('loading')) {
						pullUpEl.className = 'idle';
						pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
					}
				},
				onScrollMove: function() {
					if (this.y > OFFSET && !pullDownEl.className.match('flip')) {
						pullDownEl.className = 'flip';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '松手开始刷新...';
						this.minScrollY = 0;
					} else if (this.y < OFFSET && pullDownEl.className.match('flip')) {
						pullDownEl.className = 'idle';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
						this.minScrollY = -pullDownOffset;
					} 
					if (this.y < (maxScrollY - pullUpOffset - OFFSET) && !pullUpEl.className.match('flip')) {
						if (hasMoreData) {
							this.maxScrollY = this.maxScrollY - pullUpOffset;
							pullUpEl.className = 'flip';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '松手开始刷新...';
						}
					} else if (this.y > (maxScrollY - pullUpOffset - OFFSET) && pullUpEl.className.match('flip')) {
						if (hasMoreData) {
							this.maxScrollY = maxScrollY;
							pullUpEl.className = 'idle';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
						}
					}
				},
				onScrollEnd: function() {
					if (pullDownEl.className.match('flip')) {
						pullDownEl.className = 'loading';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '加载中...';
						// pullDownAction(); // Execute custom function (ajax call?)
						refresh();
					}
					if (hasMoreData && pullUpEl.className.match('flip')) {
						pullUpEl.className = 'loading';
						pullUpEl.querySelector('.pullUpLabel').innerHTML = '加载中...';
						// pullUpAction(); // Execute custom function (ajax call?)
						nextPage();
					}
				}
			});

			$("#thelist").empty();
			$.each(response, function(key, value) {
				var state = value.state;//0：未开始 1:使用中 2已过期
				var cname = value.name;//停车场名称
				var pname = value.parkname;//套餐名称
				var price = value.price;//套餐单价
				var prodid = value.prodid;
				var cid = value.cid;//套餐单价
				var limitdate = "有效期 " + value.limitdate;//有效期
				var limittime = "可用时间："+ value.limittime;//有效时段
				var limitday = value.limitday;//剩余天数
				
				var money_class = "money";
				var ticketname_class = "ticketname";
				var ticketinfo_class = "ticketinfo";
				var ticketlimit_class = "normal";
				var line_class = "line";
				var useinfo_class = "useinfoused";
				
				var guoqi = "未使用";
				if(state == 1){
					guoqi = "使用中";
				}else if(state == 2){
					guoqi = "已过期";
					money_class = "moneyused";
					ticketname_class = "ticketnameused";
					ticketinfo_class = "ticketinfoused";
					ticketlimit_class = "normalused";
					line_class = "lineuesd";
					useinfo_class = "useinfoexp";
				}
				var click=' onclick="rewand('+prodid+','+cid+')"';
				$("#thelist").append('<li '+click+' class="li1"><div class="moneyouter"><span class="'+money_class+'">'+price+'<span class="fuhao">元</span></span></div><a class="a1" href="#"><div class="'+ticketname_class+'">'+
						pname+'</div><div class="'+ticketinfo_class+'">'+limittime+'</div><div class="ticketlimit"><span class="sel_fee '+ticketlimit_class+'">'+cname+'</span></div></a><div class="rewand">续费</div></li>');
				$("#thelist").append('<li class="li2"><div class="'+line_class+'"></div><a class="a2" href="#"><div class="'+useinfo_class+'">'+guoqi+'</div><div class="limittime">'+limitdate+'</div></a></li>');
				
			});
			myScroll.refresh(); 
			if(response.length == 0){
				$(".middle").removeClass("hide");
			}
			if (hasMoreData) {
				myScroll.maxScrollY = myScroll.maxScrollY + pullUpOffset;
			} else {
				myScroll.maxScrollY = myScroll.maxScrollY;
			}
			maxScrollY = myScroll.maxScrollY;
		};
	},
	"json");
}

function nextPage() {
	var mobile=$("#mobile")[0].value;
	page++;
	$.post("carowner.do", {
		"page": page,
		"pagesize": PAGESIZE,
		"mobile" : mobile,
		"action" : "products"
	},
	function(response, status) {
		if (status == "success") {
			$("#thelist").show();

			if (response.length < PAGESIZE) {
				hasMoreData = false;
				$("#pullUp").hide();
			} else {
				hasMoreData = true;
				$("#pullUp").show();
			}

			// document.getElementById('wrapper').style.left = '0';

			myScroll = new iScroll('wrapper', {
				useTransition: true,
				topOffset: pullDownOffset,
				onRefresh: function() {
					if (pullDownEl.className.match('loading')) {
						pullDownEl.className = 'idle';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
						this.minScrollY = -pullDownOffset;
					}
					if (pullUpEl.className.match('loading')) {
						pullUpEl.className = 'idle';
						pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
					}
				},
				onScrollMove: function() {
					if (this.y > OFFSET && !pullDownEl.className.match('flip')) {
						pullDownEl.className = 'flip';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '松手开始刷新...';
						this.minScrollY = 0;
					} else if (this.y < OFFSET && pullDownEl.className.match('flip')) {
						pullDownEl.className = 'idle';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
						this.minScrollY = -pullDownOffset;
					} 
					if (this.y < (maxScrollY - pullUpOffset - OFFSET) && !pullUpEl.className.match('flip')) {
						if (hasMoreData) {
							this.maxScrollY = this.maxScrollY - pullUpOffset;
							pullUpEl.className = 'flip';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '松手开始刷新...';
						}
					} else if (this.y > (maxScrollY - pullUpOffset - OFFSET) && pullUpEl.className.match('flip')) {
						if (hasMoreData) {
							this.maxScrollY = maxScrollY;
							pullUpEl.className = 'idle';
							pullUpEl.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
						}
					}
				},
				onScrollEnd: function() {
					if (pullDownEl.className.match('flip')) {
						pullDownEl.className = 'loading';
						pullDownEl.querySelector('.pullDownLabel').innerHTML = '加载中...';
						// pullDownAction(); // Execute custom function (ajax call?)
						refresh();
					}
					if (hasMoreData && pullUpEl.className.match('flip')) {
						pullUpEl.className = 'loading';
						pullUpEl.querySelector('.pullUpLabel').innerHTML = '加载中...';
						// pullUpAction(); // Execute custom function (ajax call?)
						nextPage();
					}
				}
			});

			$("#thelist").empty();
			$.each(response, function(key, value) {
				var state = value.state;//0：未开始 1:使用中 2已过期
				var cname = value.name;//停车场名称
				var pname = value.parkname;//套餐名称
				var price = value.price;//套餐单价
				var limitdate = "有效期 " + value.limitdate;//有效期
				var limittime = "可用时间："+ value.limittime;//有效时段
				var limitday = value.limitday;//剩余天数
				
				var money_class = "money";
				var ticketname_class = "ticketname";
				var ticketinfo_class = "ticketinfo";
				var ticketlimit_class = "normal";
				var line_class = "line";
				var useinfo_class = "useinfoused";
				
				var guoqi = "未使用";
				if(state == 1){
					guoqi = "使用中";
				}else if(state == 2){
					guoqi = "已过期";
					money_class = "moneyused";
					ticketname_class = "ticketnameused";
					ticketinfo_class = "ticketinfoused";
					ticketlimit_class = "normalused";
					line_class = "lineuesd";
					useinfo_class = "useinfoexp";
				}
				$("#thelist").append('<li class="li1"><div class="moneyouter"><span class="'+money_class+'">'+price+'<span class="fuhao">元</span></span></div><a class="a1" href="#"><div class="'+ticketname_class+'">'+pname+'</div><div class="'+ticketinfo_class+'">'+limittime+'</div><div class="ticketlimit"><span class="sel_fee '+ticketlimit_class+'">'+cname+'</span></div></a><div class="rewand">续费</div></li>');
				$("#thelist").append('<li class="li2"><div class="'+line_class+'"></div><a class="a2" href="#"><div class="'+useinfo_class+'">'+guoqi+'</div><div class="limittime">'+limitdate+'</div></a></li>');
				
			});
			myScroll.refresh(); 
			if(response.length == 0){
				$(".middle").removeClass("hide");
			}
			if (hasMoreData) {
				myScroll.maxScrollY = myScroll.maxScrollY + pullUpOffset;
			} else {
				myScroll.maxScrollY = myScroll.maxScrollY;
			}
			maxScrollY = myScroll.maxScrollY;
		};
	},
	"json");
}



//扩展Date的format方法   
Date.prototype.format = function (format) {  
  var o = {  
      "M+": this.getMonth() + 1,  
      "d+": this.getDate(),  
      "h+": this.getHours(),  
      "m+": this.getMinutes(),  
      "s+": this.getSeconds(),  
      "q+": Math.floor((this.getMonth() + 3) / 3),  
      "S": this.getMilliseconds()  
  }  
  if (/(y+)/.test(format)) {  
      format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));  
  }  
  for (var k in o) {  
      if (new RegExp("(" + k + ")").test(format)) {  
          format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));  
      }  
  }  
  return format;  
}

/**   
*转换long值为日期字符串   
* @param l long值   
* @param isFull 是否为完整的日期数据,   
*               为true时, 格式如"2000-03-05 01:05:04"   
*               为false时, 格式如 "2000-03-05"   
* @return 符合要求的日期字符串   
*/    

function getSmpFormatDateByLong(l, isFull) {  
   return getSmpFormatDate(new Date(l), isFull);  
}  

/**   
*转换日期对象为日期字符串   
* @param date 日期对象   
* @param isFull 是否为完整的日期数据,   
*               为true时, 格式如"2000-03-05 01:05:04"   
*               为false时, 格式如 "2000-03-05"   
* @return 符合要求的日期字符串   
*/    
function getSmpFormatDate(date, isFull) {  
    var pattern = "";  
    if (isFull == true || isFull == undefined) {  
        pattern = "yyyy-MM-dd hh:mm:ss";  
    } else {  
        pattern = "yyyy-MM-dd";  
    }  
    return getFormatDate(date, pattern);  
} 

/**   
 *转换日期对象为日期字符串   
 * @param l long值   
 * @param pattern 格式字符串,例如：yyyy-MM-dd hh:mm:ss   
 * @return 符合要求的日期字符串   
 */    
 function getFormatDate(date, pattern) {  
     if (date == undefined) {  
         date = new Date();  
     }  
     if (pattern == undefined) {  
         pattern = "yyyy-MM-dd hh:mm:ss";  
     }  
     return date.format(pattern);  
 }
