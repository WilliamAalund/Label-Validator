import "../index.css";

const AppHeader = () => {
    return (
        <div className="app-header">
            <div className="app-header-left">
                <img src="/Made-In-USA-Emblem.png" alt="Made in USA Emblem" />
                <div>
                    <h1>TTB Label Validator</h1>
                    <p>Validate TTB Label applications with AI</p>
                </div>
            </div>
            <div className="app-header-right">
                <p>PROTOTYPE</p>
            </div>
        </div>
    );
};

export default AppHeader;