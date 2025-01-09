import "./App.css";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { UAParser } from "ua-parser-js";

function App() {
  const socket = io("https://notification-server-qmpo.onrender.com");

  const [message, setMessage] = useState("");
  const [messageReceived, setMessageReceived] = useState("");

  const parser = new UAParser();
  const result = parser.getResult();
  const [location, setLocation] = useState({ latitude: "", longitude: "" });
  const [error, setError] = useState("");
  const [userAgent, setUserAgent] = useState();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message);
      console.log("from server", data);
    });
    socket.on("notificationSend", (data) => {
      console.log("from server", data);
      if (Notification.permission === "granted") {
        new Notification(data.title, {
          body: data.message,
          icon: data.icon || "https://example.com/default-icon.png", // ডিফল্ট আইকন
        });
      }
    });
    return () => {
      socket.off("connect");
      socket.off("receive_message");
    };
  }, [socket]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (err) => {
          setError("Unable to retrieve location");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }

    const data = {
      device: result.device,
      os: result.os,
      browser: result.browser,
    };

    setUserAgent({
      browser: result.browser,
      os: result.os,
      device: result.device,
    });
    if ("Notification" in window) {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted!");

            socket.emit("notificationAccepted", "TRUE");
          } else {
            console.log("Notification permission denied!");
          }
        })
        .catch((error) => {
          console.error("Error requesting notification permission:", error);
        });
    } else {
      console.log("Notifications are not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    console.log("Button clicked");

    if (location && userAgent) {
      socket.emit("send_message", {
        message: { useragent: userAgent, location: location },
      });
    }
  }, [userAgent, location]);

  return (
    <div className="App">
      <div className="title">
        <h1>Welcome to push notification system,developed by Ahon khan</h1>
      </div>
    </div>
  );
}

export default App;
