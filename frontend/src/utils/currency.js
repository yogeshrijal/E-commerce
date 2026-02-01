export const formatPrice = (amount, showDecimals = true) => {
    const numAmount = Number(amount);

    if (isNaN(numAmount)) {
        return 'Rs 0';
    }

    if (showDecimals) {
        return `Rs ${numAmount.toFixed(2)}`;
    }

    return `Rs ${Math.round(numAmount)}`;
};

export const formatNumber = (number) => {
    const num = Number(number);

    if (isNaN(num)) {
        return '0';
    }

    return num.toLocaleString('en-IN');
};

export const formatPriceWithCommas = (amount, showDecimals = true) => {
    const numAmount = Number(amount);

    if (isNaN(numAmount)) {
        return 'Rs 0';
    }

    const formatted = showDecimals
        ? numAmount.toFixed(2)
        : Math.round(numAmount).toString();

    return `Rs ${formatNumber(formatted)}`;
};
