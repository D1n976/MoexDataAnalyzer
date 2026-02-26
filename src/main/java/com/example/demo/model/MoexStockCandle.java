package com.example.demo.model;

public class MoexStockCandle {
    public String NAME;
    public String TRADEDATE;
    public double OPEN;
    public double LOW;
    public double HIGH;
    //цена закрытия
    public double CLOSE;
    //объём торгов
    public double VOLUME;

    public MoexStockCandle(String tradedate, String shortName, double open, double high, double low, double close, long volume) {
        this.TRADEDATE = tradedate;
        this.NAME = shortName;
        this.OPEN = open;
        this.LOW = low;
        this.HIGH = high;
        this.CLOSE = close;
        this.VOLUME = volume;
    }
}
