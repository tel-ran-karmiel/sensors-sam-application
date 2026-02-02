# Task Definition
## Fill file app.mjs for abnormal-sensor-data
### Introduce config object the same as in imitator for normal values
### If the coming value less than minimal value
send to topic for low values an JSON containing sensorId, value, minValue, timestamp 
### If the coming value greater than maximal value 
send to topic for high values an JSON containing sensorId, value, maxValue, timestamp
### Fill file app.mjs for high-data-processor
printing coming data as sensorId, value, maxValue, date-time received from timestamp
### Fill file app.mjs for low-data-processor
printing coming data as sensorId, value, minValue, date-time received from timestamp
