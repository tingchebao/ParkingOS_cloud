var getObj = function(id) {
	return document.getElementById(id);
};


function loaddata(){
	url = "colltrend.do?action=querytrend&btime="+ 
		getObj('btime').value +"&etime="+ getObj('etime').value;
	$.post(url, function(result) {
		hiddlecontent(result);
	});
}

function hiddlecontent(result) {
	
	var data1 = new Array();
	var data2 = new Array();
	var data3 = new Array();
	var data4 = new Array();
	var yAxisTitle = "金额";
	var titleText = "停车收费趋势曲线";
	var subtitleText = "";
	xAxisTitle = "选定的时间段:"+getObj('btime').value+" 至 "+getObj('etime').value;
	var xAxisCategories = new Array();
	$.each(eval(result), function(i, paydate) {
		if (xAxisCategories[i] == "") {

		} else {
			xAxisCategories[i] = paydate.time;
			data1[i] = parseInt(paydate.cashTotalFee);
			data2[i] = parseInt(paydate.ePayTotalFee);
			data3[i] = parseInt(paydate.cardTotalFee);
			data4[i] = data1[i] + data2[i] + data3[i];
		}
	});
	
	$(document).ready(
			function() {
				var chart = new Highcharts.Chart( {
					chart : {
						renderTo : "chart_container",
						defaultSeriesType : "line",
						plotBorderColor : "#e0e0e0",
						plotBorderWidth : 1
					//zoomType: "xy" // 是否及放大方向
					},
					title : {
						text : titleText,
						style : {
							font : 'bold 16px  宋体, sans-serif',
							color : '#000'
						}
					},
					subtitle : {
						text : subtitleText,
						style : {
							font : 'normal 12px  宋体, sans-serif',
							color : '#999'
						}
					},
					legend : {
						enabled : true
					},
					xAxis : {
						title : {
							text : xAxisTitle,
							style : {
								font : 'normal 12px 宋体, sans-serif',
								color : '#000',
								margin : '7px000'
							}
						},
						categories : xAxisCategories,
						labels : {
							rotation : -40, //坐标值显示的倾斜度
							align : 'right',
							style : {
								font : 'normal 10px Verdana, sans-serif'
						}
					}
				},
				yAxis : {
					min : 0,
					maxPadding : 0,
					title : {
						text : yAxisTitle,
						style : {
							font : 'normal 12px 宋体, sans-serif',
							color : '#000'
						}
					}
				},
				tooltip : {
					//enabled : true,
					formatter : function() {
						return "<b>" + this.series.name + "</b><br/>"
								+ this.x + ": " + this.y + "元";
					}
				},
				plotOptions : {
					line : {
						dataLabels : {
							enabled : true
						},
						enableMouseTracking : true
					}
				},
				series : [ {
					name : "现金收费",
					data : data1
				}, {
					name : "电子收费",
					data : data2
				},{
					name : "刷卡收费",
					data : data3
				},{
					name : "总收费",
					data : data4
				}]
			});
		});
}