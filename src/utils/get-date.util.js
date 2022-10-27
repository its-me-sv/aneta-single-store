const getDate = (temp) => {
    const year = temp.getFullYear();
    const month = 1 + temp.getMonth();
    const date = temp.getDate();
    return `${year}-${month}-${date}`;
};

module.exports = getDate;