# hc-data-collection

> npm install

> npm start

The output of the session is downloaded as the JSON file with the timestamp of the session

Signals are stored as <ID>.wav in /signals/

The corresponding descriptions are stored as <ID>.json in /descriptions/

Example of Signal descriptions:

```
 {
    "sensoryDescriptions": [
        "The signal is smooth and quiet.",
        "The signal is rough and noisy."    
    ],
    "emotionalDescriptions": [
        "The signal is calm and peaceful.",
        "The signal is tense and anxious."
    ],
    "associativeDescriptions": [
        "The signal reminds me of a lathe machine",
        "The signal reminds me of a suspenseful movie"
    ]
}
```