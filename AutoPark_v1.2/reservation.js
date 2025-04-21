document.addEventListener("DOMContentLoaded", function () {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAOLjRxraC5K-le7yv-kwvDQPea8Ju3z5s",
        authDomain: "parkvue-7aad4.firebaseapp.com",
        projectId: "parkvue-7aad4",
        storageBucket: "parkvue-7aad4.firebasestorage.app",
        messagingSenderId: "417337950143",
        appId: "1:417337950143:web:0c5d9b01aaa51213ee2b0a",
        measurementId: "G-W6KGZ59QDK"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // DOM elements
    const durationInput = document.getElementById("duration");
    const priceDisplay = document.getElementById("priceDisplay");
    const reservationForm = document.getElementById("reservationForm");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const viewDateInput = document.getElementById("viewDate");
    const viewBtn = document.getElementById("viewBtn");
    const occupancyList = document.getElementById("occupancyList");

    const pricePerHour = 50;
    let currentUser = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    // Set minimum dates to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    viewDateInput.min = today;
    viewDateInput.value = today;

    // Initialize UI
    occupancyList.innerHTML = `
        <div class="loading-message">
            <p>Initializing parking system...</p>
        </div>
    `;

    // Auth state listener
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (!user) {
            alert("Please login to make reservations");
            window.location.href = "login.html";
        } else {
            loadOccupancyData();
        }
    });

    // Price calculation
    durationInput.addEventListener("input", updatePrice);
    function updatePrice() {
        const duration = parseFloat(durationInput.value) || 0;
        priceDisplay.textContent = `Total Price: ₹${duration * pricePerHour}`;
    }

    // Load occupancy data
    viewBtn.addEventListener("click", () => {
        retryCount = 0;
        loadOccupancyData();
    });
    viewDateInput.addEventListener("change", function() {
        if (viewDateInput.value) {
            retryCount = 0;
            loadOccupancyData();
        }
    });

    async function loadOccupancyData() {
        const selectedDate = viewDateInput.value;
        if (!selectedDate) {
            occupancyList.innerHTML = "<p>Please select a date</p>";
            return;
        }

        try {
            // Show loading state
            occupancyList.innerHTML = `
                <div class="loading-message">
                    <p>Loading parking data for ${selectedDate}...</p>
                </div>
            `;
            
            const querySnapshot = await db.collection("reservations")
                .where("date", "==", selectedDate)
                .orderBy("time")
                .get();

            // Reset retry counter on success
            retryCount = 0;
            
            // Process reservations
            const reservations = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                reservations.push({
                    id: doc.id,
                    parkingLot: data.parkingLot,
                    time: data.time,
                    duration: data.duration,
                    endTime: addHours(data.time, data.duration),
                    userId: data.userId
                });
            });

            // Generate time slots (8AM to 8PM)
            const slots = [];
            for (let hour = 8; hour <= 20; hour++) {
                const time = `${hour.toString().padStart(2, '0')}:00`;
                const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                
                // Check for conflicts
                const conflicts = reservations.filter(res => 
                    (time >= res.time && time < res.endTime) ||
                    (endTime > res.time && endTime <= res.endTime) ||
                    (time <= res.time && endTime >= res.endTime)
                );

                slots.push({
                    time,
                    endTime,
                    isAvailable: conflicts.length === 0,
                    parkingLots: conflicts.map(r => r.parkingLot),
                    isUserReservation: conflicts.some(r => r.userId === currentUser?.uid)
                });
            }

            // Display grouped time slots
            displayTimeSlots(slots);

        } catch (error) {
            console.error("Error loading occupancy:", error);
            retryCount++;
            
            if (error.message.includes("index") && retryCount < MAX_RETRIES) {
                // Index-related error - auto-retry with delay
                occupancyList.innerHTML = `
                    <div class="error-message">
                        <p>Preparing parking data...</p>
                        <p>This may take a moment (attempt ${retryCount}/${MAX_RETRIES})</p>
                        <button onclick="loadOccupancyData()">Retry Now</button>
                        <p class="small">Auto-retrying in 5 seconds...</p>
                    </div>
                `;
                setTimeout(loadOccupancyData, 5000);
            } else {
                // Other errors or max retries reached
                occupancyList.innerHTML = `
                    <div class="error-message">
                        <p>Failed to load parking data</p>
                        ${retryCount >= MAX_RETRIES ? 
                          '<p>Maximum retries reached. Please refresh the page.</p>' : 
                          `<p>${error.message}</p>`}
                        <button onclick="loadOccupancyData()">Retry</button>
                    </div>
                `;
            }
        }
    }

    function displayTimeSlots(slots) {
        occupancyList.innerHTML = "";
        
        if (slots.every(slot => slot.isAvailable)) {
            occupancyList.innerHTML = `
                <div class="time-slot full-day">
                    <span class="time">All day</span>
                    <span class="status available">Fully Available</span>
                </div>
            `;
            return;
        }

        let currentStart = null;
        let currentEnd = null;
        let currentStatus = null;
        let currentLots = [];
        let currentIsUserReservation = false;

        const displayGroup = () => {
            if (currentStart) {
                const slotElement = document.createElement("div");
                slotElement.className = `time-slot ${currentIsUserReservation ? 'user-reservation' : ''}`;
                
                if (currentStatus === 'booked') {
                    slotElement.innerHTML = `
                        <span class="time">${currentStart} - ${currentEnd}</span>
                        <span class="status booked">
                            ${currentIsUserReservation ? 'Already reserved' : 'Booked'} (${currentLots.join(", ")})
                        </span>
                    `;
                } else {
                    slotElement.innerHTML = `
                        <span class="time">${currentStart} - ${currentEnd}</span>
                        <span class="status available">Available</span>
                    `;
                }
                
                occupancyList.appendChild(slotElement);
            }
        };

        slots.forEach(slot => {
            const status = slot.isAvailable ? 'available' : 'booked';
            const lots = slot.parkingLots.join(", ");
            const isUserReservation = slot.isUserReservation;
            
            if (status !== currentStatus || 
                lots !== currentLots.join(", ") ||
                isUserReservation !== currentIsUserReservation) {
                displayGroup();
                currentStart = slot.time;
                currentStatus = status;
                currentLots = slot.parkingLots;
                currentIsUserReservation = isUserReservation;
            }
            currentEnd = slot.endTime;
        });

        displayGroup();
    }

    function addHours(time, hours) {
        const [h, m] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(h + hours, m);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    // Form submission
    reservationForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        if (!currentUser) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const parkingLot = document.getElementById("parkingLot").value;
        const date = dateInput.value;
        const time = timeInput.value;
        const duration = parseInt(durationInput.value);

        if (!date || !time || !duration) {
            alert("Please fill all fields");
            return;
        }

        try {
            // Check availability
            const isAvailable = await checkSlotAvailability(date, time, duration);
            if (!isAvailable) {
                alert("This time slot is already booked. Please choose another time.");
                return;
            }

            // Create reservation
            const docRef = await db.collection("reservations").add({
                parkingLot,
                date,
                time,
                duration,
                totalPrice: duration * pricePerHour,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Show success
            showConfirmation({
                id: docRef.id,
                parkingLot,
                date,
                time,
                duration
            });

            // Reset form
            reservationForm.reset();
            priceDisplay.textContent = "Total Price: ₹0";
            
            // Refresh view if same date
            if (viewDateInput.value === date) {
                await loadOccupancyData();
            }

        } catch (error) {
            console.error("Reservation error:", error);
            alert(`Reservation failed: ${error.message}`);
        }
    });

    async function checkSlotAvailability(date, time, duration) {
        const selectedEnd = addHours(time, duration);
        
        const querySnapshot = await db.collection("reservations")
            .where("date", "==", date)
            .get();

        for (const doc of querySnapshot.docs) {
            const { time: slotTime, duration: slotDuration } = doc.data();
            const slotEnd = addHours(slotTime, slotDuration);
            
            if (
                (time >= slotTime && time < slotEnd) ||
                (selectedEnd > slotTime && selectedEnd <= slotEnd) ||
                (time <= slotTime && selectedEnd >= slotEnd)
            ) {
                return false;
            }
        }
        return true;
    }

    function showConfirmation(reservation) {
        const confirmationHTML = `
            <div class="confirmation">
                <h3>Reservation Confirmed!</h3>
                <p><strong>ID:</strong> ${reservation.id}</p>
                <p><strong>Lot:</strong> ${reservation.parkingLot}</p>
                <p><strong>Date:</strong> ${reservation.date}</p>
                <p><strong>Time:</strong> ${reservation.time} (${reservation.duration} hrs)</p>
                <p><strong>Total:</strong> ₹${reservation.duration * pricePerHour}</p>
            </div>
        `;
        
        // You can display this in a modal or as an alert
        alert(`Reservation Successful!\n\nID: ${reservation.id}\nLot: ${reservation.parkingLot}\nDate: ${reservation.date}\nTime: ${reservation.time}\nDuration: ${reservation.duration} hours`);
    }

    // Initialize
    updatePrice();
});