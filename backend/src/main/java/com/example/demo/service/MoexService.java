package com.example.demo.service;
import com.example.demo.model.MoexStockCandle;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MoexService {
    OkHttpClient client;
    private final ObjectMapper mapper;

    public MoexService() {
        client = new OkHttpClient();
        mapper = new ObjectMapper();
    }

    public List<MoexStockCandle> GetData(String secid, LocalDate from, LocalDate till) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String url = String.format(
                "https://iss.moex.com/iss/history/engines/stock/markets/shares/securities/%s.json?from=%s&till=%s",
                secid, from.format(formatter), till.format(formatter)
        );
        Request r = new Request.Builder()
                .url(url)
                .header("Accept", "application/json")
                .build();

        try {
            Response response = client.newCall(r).execute();
            return getStockCandles(response.body().string());
        }
        catch (Exception ex){
            return new ArrayList<>() {};
        }
    }

    private List<MoexStockCandle> getStockCandles(String json) throws JsonProcessingException {

        JsonNode root = mapper.readTree(json);
        JsonNode history = root.path("history");
        JsonNode columns = history.path("columns");
        JsonNode data = history.path("data");
        List<MoexStockCandle> candles = new ArrayList<>();

        for (JsonNode row : data) {
            MoexStockCandle candle = new MoexStockCandle(
                    row.get(getIndex(columns, "TRADEDATE")).asText(""),
                    row.get(getIndex(columns, "SHORTNAME")).asText(""),
                    row.get(getIndex(columns, "OPEN")).asDouble(0),
                    row.get(getIndex(columns, "HIGH")).asDouble(0),
                    row.get(getIndex(columns, "LOW")).asDouble(0),
                    row.get(getIndex(columns, "CLOSE")).asDouble(0),
                    row.get(getIndex(columns, "VOLUME")).asLong(0)
            );

            candles.add(candle);
        }
        return candles;
    }
    private int getIndex(JsonNode columns, String name) {
        for (int i = 0; i < columns.size(); i++) {
            if (columns.get(i).asText().equals(name)) {
                return i;
            }
        }
        return -1;
    }

    public List<String> getTickers() {
        ClassPathResource resource = new ClassPathResource("static/tickers");
        List<String> tickerList = new ArrayList<>(List.of());
        try (InputStream stream = resource.getInputStream()) {

            JsonNode root = mapper.readTree(new String(stream.readAllBytes(), StandardCharsets.UTF_8));
            JsonNode tickers = root.path("tickers");
            for (JsonNode ticker : tickers) {
                String symbol = ticker.path("symbol").asText();
                tickerList.add(symbol);
            }

        } catch (Exception ex) {
            System.out.println(ex.getMessage());
        }
        return tickerList;
    }
}