package com.example.demo.Controllers;

import com.example.demo.service.MoexAnalysisService;
import com.example.demo.service.MoexService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/stock/api")
@CrossOrigin
public class StockController {
    MoexService moexService;
    MoexAnalysisService moexAnalysisService;

    public StockController(MoexService moexService, MoexAnalysisService moexAnalysisService) {
        this.moexService = moexService;
        this.moexAnalysisService = moexAnalysisService;
    }

    @GetMapping("getCandles")
    public List<?> getCandles(
            @RequestParam("secid") String secid,
            @RequestParam("from") String fromStr,
            @RequestParam("till") String tillStr) {
        return moexService.GetData(secid, LocalDate.parse(fromStr), LocalDate.parse(tillStr));
    }

    @GetMapping("analyzeCandles")
    public List<MoexAnalysisService.AnalysisResult> analyzeCandles(@RequestParam("secid") String secid,
                                                                          @RequestParam("from") String fromStr,
                                                                          @RequestParam("till") String tillStr){
        return Collections.singletonList(moexAnalysisService.analyze(moexService.GetData(secid, LocalDate.parse(fromStr), LocalDate.parse(tillStr))));
    }

    @GetMapping("getTickers")
    public List<String> getTickers(){
        return moexService.getTickers();
    }
}
