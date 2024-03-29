const weekends = (price, totalDuration, startsAt, endsAt) => {
	const weekends = [6, 7];
	if(startsAt !== undefined && endsAt !== undefined) {
		if(weekends.includes(startsAt.weekday) || weekends.includes(endsAt.weekday)) {
			return price * 1.5;
		}
	}
	return price * 1;
}

const noLessThanOneHour = (price, totalDuration, startsAt, endsAt)  => { 
	return (totalDuration < 60) ? (price * (60 / totalDuration)) : (price * 1);
}

const overtime = (price, totalDuration, startsAt, endsAt) => {
	const weekdays = [1, 2, 3, 4, 5];
	const overtimeHours = [16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
	if(startsAt !== undefined && endsAt !== undefined) {
		if(startsAt.toFormat('HH:mm:ss') != '00:00:00' && endsAt.toFormat('HH:mm:ss') != '00:00:00') {
			if(weekdays.includes(startsAt.weekday) && weekdays.includes(endsAt.weekday)) {
				if(overtimeHours.includes(startsAt.hour) || overtimeHours.includes(endsAt.hour)) {
					return price * 1.5;
				}
			}
		}
	}
	return price * 1;
}

export { weekends, noLessThanOneHour, overtime }