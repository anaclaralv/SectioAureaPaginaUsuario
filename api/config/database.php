<?php
class Database{
    private $host = "143.106.241.4";      // ← Coloque seu host
    private $db_name = "cl204214";    // ← Coloque nome do seu banco
    private $username = "cl204214";  // ← Coloque seu usuário
    private $password = "cl*19072008"; // ← Coloque sua senha
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                                  $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $e) {
            echo "Erro na conexão: " . $e->getMessage();
        }
        return $this->conn;
    }
}


/*
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["erro" => "Falha na conexão: " . $e->getMessage()]));
}*/

?>