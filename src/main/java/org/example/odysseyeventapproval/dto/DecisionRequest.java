package org.example.odysseyeventapproval.dto;

public class DecisionRequest {
    private boolean approve;
    private String remark;

    public boolean isApprove() {
        return approve;
    }

    public void setApprove(boolean approve) {
        this.approve = approve;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
