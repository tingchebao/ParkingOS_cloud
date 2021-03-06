package com.zld.struts.parkadmin;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.Action;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import org.springframework.beans.factory.annotation.Autowired;

import com.zld.AjaxUtil;
import com.zld.CustomDefind;
import com.zld.impl.MongoDbUtils;
import com.zld.service.DataBaseService;
import com.zld.utils.ExportExcelUtil;
import com.zld.utils.JsonUtil;
import com.zld.utils.RequestUtil;
import com.zld.utils.SqlInfo;
import com.zld.utils.StringUtils;
import com.zld.utils.TimeTools;
/**
 * 抬杆记录
 * @author Administrator
 *
 */
public class LiftRodAction extends Action{
	
	@Autowired
	private DataBaseService daService;
	@Autowired
	private MongoDbUtils mongoDbUtils;
	
	private Logger logger = Logger.getLogger(LiftRodAction.class);

	@Override
	public ActionForward execute(ActionMapping mapping, ActionForm form,
			HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		String action = RequestUtil.processParams(request, "action");
		Long comid = (Long)request.getSession().getAttribute("comid");
		Integer role = RequestUtil.getInteger(request, "role",-1);
		Integer authId = RequestUtil.getInteger(request, "authid",-1);
		request.setAttribute("authid", authId);
		request.setAttribute("role", role);
		Long groupid = (Long)request.getSession().getAttribute("groupid");
		logger.error("lift>>>comid:"+comid+",groupid:"+groupid+",action:"+action);
		if(comid == null){
			response.sendRedirect("login.do");
			return null;
		}
		if(comid==0)
			comid = RequestUtil.getLong(request, "comid", 0L);
		logger.error("lift>>>comid:"+comid);
		if(groupid != null && groupid > 0){
			request.setAttribute("groupid", groupid);
			if(comid == null || comid <= 0){
				Map map = daService.getMap("select id,company_name from com_info_tb where groupid=? order by id limit ? ", 
						new Object[]{groupid, 1});
				logger.error("lift>>>comid:"+comid+",map:"+map);
				if(map != null){
					comid = (Long)map.get("id");
				}else{
					comid = -999L;
				}
			}
		}
		String liftReason=(String)getLiftReason(comid,0);
		logger.error("lift>>>comid:"+comid+",liftReason:"+liftReason);
		request.setAttribute("liftreason", liftReason);
		if(action.equals("")){
			request.setAttribute("comid", comid);
			return mapping.findForward("list");
		}else if(action.equals("query")){
			logger.error("lift>>>comid:"+comid);
			Integer pageNum = RequestUtil.getInteger(request, "page", 1);
			Integer pageSize = RequestUtil.getInteger(request, "rp", 20);
			String fieldsstr = RequestUtil.processParams(request, "fieldsstr");
			List list = query(request,comid,pageNum,pageSize);
			long count =(Long)list.get(1);
			String json = JsonUtil.Map2Json((List)list.get(0),pageNum,count, fieldsstr,"id");
			AjaxUtil.ajaxOutput(response, json);
			return null;
		}else if(action.equals("exportExcel")){
			Map uin = (Map)request.getSession().getAttribute("userinfo");
			List dataList =query(request,comid,1,500);
			if(dataList.isEmpty()){
				return null;
			}
			List<Map<String, Object>> list = (List)dataList.get(0);
			List<List<String>> bodyList = new ArrayList<List<String>>();
			String [] heards = null;
			if(list!=null&&list.size()>0){
				//setComName(list);
				String [] f = new String[]{"id","uin","ctime","reason"};
				heards = new String[]{"编号","收费员","时间","原因"};
				Map<Integer, String> reasonMap = (Map)getLiftReason(comid, 1);
				for(Map<String, Object> map : list){
					List<String> values = new ArrayList<String>();
					for(String field : f){
						if("uin".equals(field)){
							values.add(getUinName(Long.valueOf(map.get(field)+"")));
						}else if("reason".equals(field)){
							Integer key = Integer.valueOf(map.get(field)+"");
							if(reasonMap.get(key)!=null)
								values.add(reasonMap.get(key));
							else {
								values.add("无");
							}
						}else{
							if("ctime".equals(field)){
								if(map.get(field)!=null){
									values.add(TimeTools.getTime_yyyyMMdd_HHmmss(Long.valueOf((map.get(field)+""))*1000));
								}else{
									values.add("null");
								}
							}else{
								values.add(map.get(field)+"");
							}
						}
					}
					bodyList.add(values);
				}
			}
			String fname = "抬杆记录" + com.zld.utils.TimeTools.getDate_YY_MM_DD();
			fname = StringUtils.encodingFileName(fname);
			java.io.OutputStream os;
			try {
				response.reset();
				response.setHeader("Content-disposition", "attachment; filename="
						+ fname + ".xls");
				response.setContentType("application/x-download");
				os = response.getOutputStream();
				ExportExcelUtil importExcel = new ExportExcelUtil("抬杆记录",
						heards, bodyList);
				importExcel.createExcelFile(os);
			} catch (IOException e) {
				e.printStackTrace();
			}
//			String json = "";
//			AjaxUtil.ajaxOutput(response, json);
			return null;
		}else if(action.equals("liftpic")){
			String fileName = RequestUtil.getString(request, "filename");
			byte[] content=mongoDbUtils.getParkPic(fileName, "lift_rod_pics");
			if(content!=null){
				response.setDateHeader("Expires", System.currentTimeMillis()+4*60*60*1000);
				//response.setStatus(httpc);
				Calendar c = Calendar.getInstance();
				c.set(1970, 1, 1, 1, 1, 1);
				response.setHeader("Last-Modified", c.getTime().toString());
				response.setContentLength(content.length);
				response.setContentType("image/jpeg");
				//System.err.println(content.length);
				OutputStream o = response.getOutputStream();
				o.write(content);
				o.flush();
				o.close();
				response.flushBuffer();
			}else {
				response.sendRedirect("images/nopic.jpg");
			}
		}else if(action.equals("getUids")){
			
		}
		
		return null;
	}
	private Object getLiftReason(Long comid,int type) {
		String reason = CustomDefind.getValue("LIFTRODREASON"+comid);
		logger.error("lift>>>comid:"+comid+",reason:"+reason);
		if(type==0){
			String ret = "[{value_no:-1,value_name:\"\"},{value_no:100,value_name:\"原因未选\"}";
			if(reason!=null){
				String res[] = reason.split("\\|");
				for(int i=0;i<res.length;i++){
					ret+=",{value_no:"+i+",value_name:\""+res[i]+"\"}";
				}
			}
			ret +="]";
			return ret;
		}else {
			Map<Integer, String> reasonMap = new HashMap<Integer, String>();
			if(reason!=null){
				String res[] = reason.split("\\|");
				for(int i=0;i<res.length;i++){
					reasonMap.put(i, res[i]);
				}
			}
			return reasonMap;
		}
	}
	private String getUinName(Long uin) {
		Map list = daService.getPojo("select * from user_info_tb where id =?  ",new Object[]{uin});
		String uinName = "";
		if(list!=null&&list.get("nickname")!=null){
			uinName = list.get("nickname")+"";
		}
		return uinName;
	}
	private List query(HttpServletRequest request,long comid,Integer pageNum,Integer pageSize){
		ArrayList arrayList = new ArrayList();
		String orderfield = RequestUtil.processParams(request, "orderfield");
		String orderby = RequestUtil.processParams(request, "orderby");
		logger.error("lift>>>comid:"+comid+",orderfield:"+orderfield+",orderby:"+orderby);
		if(orderfield.equals("")){
			orderfield = "id";
		}
		if(orderby.equals("")){
			orderby = "desc";
		}
		String sql = "select * from lift_rod_tb where comid=?  ";
		String countSql = "select count(*) from lift_rod_tb where  comid=? " ;
		SqlInfo base = new SqlInfo("1=1", new Object[]{comid});
		
		SqlInfo sqlInfo = RequestUtil.customSearch(request,"lift_rod");
		List<Object> params =new ArrayList<Object>();
		
		if(sqlInfo!=null){
			sqlInfo = SqlInfo.joinSqlInfo(base,sqlInfo, 2);
			countSql+=" and "+ sqlInfo.getSql();
			sql +=" and "+sqlInfo.getSql();
			params = sqlInfo.getParams();
		}else {
			params= base.getParams();
		}
		sql += " order by " + orderfield + " " + orderby;
		//System.out.println(sqlInfo);
		Long count= daService.getCount(countSql, params);
		logger.error("lift>>>comid:"+comid+",sql:"+sql+",count:"+count);
		List<Map<String, Object>> list = null;//daService.getPage(sql, null, 1, 20);
		if(count>0){
			list = daService.getAll(sql, params, pageNum, pageSize);
			arrayList.add(list);
			arrayList.add(count);
		}else {
			arrayList.add(new ArrayList());
			arrayList.add(0L);
		}
		return arrayList;
	}
	
}