package com.example.report.controller;

import com.example.report.model.EmployeeReportRequest;
import com.example.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReportController.class)
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @Test
    public void whenPostReport_thenReturnPdf() throws Exception {
        when(reportService.generatePdf(any(EmployeeReportRequest.class))).thenReturn(new byte[]{1,2,3});

        String body = "{\"name\":\"Test\",\"role\":\"Dev\",\"period\":\"2025\",\"rating\":4}";

        mockMvc.perform(post("/api/report/pdf")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());
    }
}
