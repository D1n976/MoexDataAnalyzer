package com.example.demo.service;

import com.example.demo.model.MoexStockCandle;
import org.springframework.stereotype.Service;

import java.util.DoubleSummaryStatistics;
import java.util.List;

@Service
public class MoexAnalysisService {

    /**
     * Средняя цена закрытия
     */
    public double averageClose(List<MoexStockCandle> candles) {
        return candles.stream()
                .mapToDouble(c -> c.CLOSE)
                .average()
                .orElse(0.0);
    }

    /**
     * Максимальная цена закрытия
     */
    public double maxClose(List<MoexStockCandle> candles) {
        return candles.stream()
                .mapToDouble(c -> c.CLOSE)
                .max()
                .orElse(0.0);
    }

    /**
     * Минимальная цена закрытия
     */
    public double minClose(List<MoexStockCandle> candles) {
        return candles.stream()
                .mapToDouble(c -> c.CLOSE)
                .min()
                .orElse(0.0);
    }

    /**
     * Суммарный объём торгов
     */
    public double totalVolume(List<MoexStockCandle> candles) {
        return candles.stream()
                .mapToDouble(c -> c.VOLUME)
                .sum();
    }

    /**
     * Изменение цены за период (последнее закрытие - первое закрытие)
     */
    public double priceChange(List<MoexStockCandle> candles) {
        if (candles.isEmpty()) return 0.0;
        double firstClose = candles.get(0).CLOSE;
        double lastClose = candles.get(candles.size() - 1).CLOSE;
        return lastClose - firstClose;
    }

    /**
     * Процентное изменение
     */
    public double priceChangePercent(List<MoexStockCandle> candles) {
        if (candles.isEmpty()) return 0.0;
        double firstClose = candles.get(0).CLOSE;
        if (firstClose == 0) return 0.0;
        double lastClose = candles.get(candles.size() - 1).CLOSE;
        return (lastClose - firstClose) / firstClose * 100;
    }

    /**
     * Простая скользящая средняя (SMA) за последние N дней.
     * Возвращает массив значений для каждой свечи, начиная с N-1 индекса.
     */
    public double[] simpleMovingAverage(List<MoexStockCandle> candles, int period) {
        if (candles.size() < period) return new double[0];
        double[] sma = new double[candles.size() - period + 1];
        for (int i = period - 1; i < candles.size(); i++) {
            double sum = 0;
            for (int j = i - period + 1; j <= i; j++) {
                sum += candles.get(j).CLOSE;
            }
            sma[i - period + 1] = sum / period;
        }
        return sma;
    }

    /**
     * Получить статистику в виде объекта
     */
    public AnalysisResult analyze(List<MoexStockCandle> candles) {
        DoubleSummaryStatistics closeStats = candles.stream()
                .mapToDouble(c -> c.CLOSE)
                .summaryStatistics();
        return new AnalysisResult(
                closeStats.getAverage(),
                closeStats.getMax(),
                closeStats.getMin(),
                totalVolume(candles),
                priceChange(candles),
                priceChangePercent(candles),
                candles.size()
        );
    }

    public static class AnalysisResult {
        public double avgClose;
        public double maxClose;
        public double minClose;
        public double totalVolume;
        public double priceChange;
        public double priceChangePercent;
        public int days;

        public AnalysisResult(double avgClose, double maxClose, double minClose,
                              double totalVolume, double priceChange,
                              double priceChangePercent, int days) {
            this.avgClose = avgClose;
            this.maxClose = maxClose;
            this.minClose = minClose;
            this.totalVolume = totalVolume;
            this.priceChange = priceChange;
            this.priceChangePercent = priceChangePercent;
            this.days = days;
        }
    }
}