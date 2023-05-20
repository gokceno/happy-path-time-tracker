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

module.exports = { weekends, noLessThanOneHour }