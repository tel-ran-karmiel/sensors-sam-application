# Task Definition
## Update working code of abnormal-sensor-data lambda function
1. Design and implement stale cache functionality <br>
2. Think of a solution allowing request for the specific sensor data by two conditions<br>
2.1 If no data exist in the cache for the specific sensor<br>
2.2 If time from inserting the specific sensor min/max values into cache <br>(SENSORS_NORMAL_VALUES object) exceeds time period in seconds value at environment variable STALE_TIME 