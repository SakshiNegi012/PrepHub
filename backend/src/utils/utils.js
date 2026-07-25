export function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpHtml(otp){
    return ` <!Doctype html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>OTP Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .otp {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                .message {
                    font-size: 16px;
                    color: #666;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #666;
                }
                    
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Your OTP is: ${otp}</h1>
                <p>Please use this OTP to verify your account.</p>
            </div>
        </body>
    </html>`;
}

